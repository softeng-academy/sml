<template>
    <div class="fill-height d-flex background">
        <title-bar :currentFile="currentFile" :unsaved="unsaved" v-if="runningInElectron"/>

        <v-container fluid class="fill-height fill-width pl-14 pr-0 overflow-hidden" :style="{paddingTop: runningInElectron ? '46px' : '16px'}">
            <SideBar ref="sidebar" 
                :sml="sml" 
                @updatePropVisibility="updatePropVisibility" 
                @toggleDarkMode="toggleDarkMode"
                @saveAs="saveAs" 
                @importSvg="importSvg" 
                @save="save"
                @openSettings="openSettings"
                class="sidebar"
                :style="{paddingTop: runningInElectron ? '32px' : '8px'}"
            />

            <v-row class="main-row-jointjs" no-gutters ref="jointjsRow">
                <div v-if="errorState === true" class="errorBox">
                    DSL is faulty
                </div>

                <v-btn icon class="button-scale" @click="() => sml.scaleContentToFit()">
                    <v-icon>mdi-fit-to-screen-outline</v-icon>
                </v-btn>
                
                <div
                    class="fill-height fill-width jointjs jointjs-bg" 
                    ref="myholder"
                    @dragover.prevent 
                    @dragstart.prevent 
                    @drop="drop($event, 'elem')"
                />

                <div v-if="exporting" class="text-center export-loader">
                    <v-progress-circular
                    indeterminate
                    :size="50"
                    color="primary"
                    ></v-progress-circular>
                    Exporting...
                </div>
            </v-row>

            <div class="dragger pl-3 pr-3" ref="dragger">
                <v-divider/>

                <v-icon class="dragger-icon">
                    mdi-dots-horizontal
                </v-icon>
            </div>

            <v-row class="main-row-editor" no-gutters ref="editorRow">
                    <editor 
                        @setErrorState="setErrorState" 
                        @fileChanged="fileChanged" 
                        @editorReady="rerenderSML"
                        :sml="sml" 
                        :autoFormatting="$store.autoFormatting" 
                        :key="this.$vuetify.theme.dark"
                        ref="editor" 
                    />
            </v-row>

            <v-snackbar
                v-model="snackbarOpen"
                timeout="5000"
                color="primary" 
            >
                {{snackbarText ? snackbarText : currentFile ? 'File at ' + currentFile + ' saved.' : ''}}

                <template v-slot:action="{ attrs }">
                    <v-btn color="primary" text v-bind="attrs" @click="snackbar = false">
                        Close
                    </v-btn>
                </template>
            </v-snackbar>
        </v-container>

        <v-container v-show="propEditorVisible" fluid class="prop-editor pl-0" :style="{paddingTop: runningInElectron ? '46px' : '16px'}">
            <PropEditor 
                ref="propEditor" 
                :astq="astq" 
                :ast="ast" 
                :sml="sml"
                class="fill-width">
            </PropEditor>
        </v-container>
        <input ref="fileInput" type="file" accept=".sml,.svg" style="display:none" @change="handleFileChange"/>
    </div>
</template>

<script>
    import { elementToSVG } from 'dom-to-svg'
    import isElectron       from 'is-electron'
    let electron
    if (isElectron())
        electron = import('electron')
    import SideBar          from '../components/SideBar'
    import Editor           from '../components/Editor'
    import PropEditor       from '../components/PropEditor'
    import TitleBar         from '../components/TitleBar.vue'
    import SML              from '../lib/sml.js'

    export default {
        name: 'MainView',
        components: { SideBar, TitleBar, Editor, PropEditor },
        async mounted () {
            localStorage.setItem('dsl', '')

            //  Temporarily add global event listeners for dragger widget
            this.$refs.dragger.addEventListener('mousedown', () => {
                window.addEventListener('mousemove', this.handleDrag)
            })
            this.$refs.dragger.addEventListener('mouseup', () => {
                window.removeEventListener('mousemove', this.handleDrag)
            })

            //  Add global window event listeners
            window.addEventListener('resize', this.handleResize)

            if (isElectron()) {
                //  Add file saving and loading listeners via electron
                electron = await electron
                electron.ipcRenderer.on('importedFile', (event, msg) => {
                    if (msg.data) {
                        //  Load DSL from svg and set to editor
                        const parser = new DOMParser()
                        const doc = parser.parseFromString(msg.data.substring(msg.data.indexOf('<')), 'image/svg+xml')
                        const errorNode = doc.querySelector('parsererror');

                        //  Find correct content
                        let content
                        if (errorNode)
                            content = msg.data ?? ''
                        else
                            content = doc.querySelector('dsl')?.textContent ?? ''

                        if (!content) {
                            this.noValidData()
                        }
                        else {
                            this.updateEditor(content)
                            this.$refs.editor.parse(true)
                            this.unsaved = false
    
                            //  Set current file
                            this.currentFile = msg.path
                            electron.ipcRenderer.send('loadingSuccess')
                        }
                    }
                    else {
                        this.snackbarText = 'Loading failed.'
                        this.snackbarOpen = true
                    }
                })
                electron.ipcRenderer.on('fileSaved', (event, data) => {
                    this.currentFile = data
                    this.unsaved = false
                    this.snackbarText = `File ${this.currentFile} was saved.`
                    this.snackbarOpen = true
                })
                
                //  Add theme listeners
                electron.ipcRenderer.on('darkModeStatus', (event, data) => {
                    //  Store current DSL and force recreation of editor and sml
                    if (this.$refs?.editor) {
                        localStorage.setItem('dsl', this.$refs.editor.getDsl())
                        this.$vuetify.theme.dark = data
                    }
                })
                
                //  Request dark mode
                electron.ipcRenderer.send('darkModeStatus')
            }
            else {
                if (this.$refs?.editor) {
                    localStorage.setItem('dsl', this.$refs.editor.getDsl())
                    this.$vuetify.theme.dark = localStorage.getItem('darkMode') === 'true' ?? false
                }
            }
        },
        async beforeUnmount () {
            //  Remove global window event listeners
            window.removeEventListener('resize', this.handleResize)
        },
        data () {
            return {
                propEditorVisible: true,
                ast: null,
                astq: null,
                editor: null,
                errorState: false,
                sml: null,
                currentFile: null,
                snackbarOpen: false,
                snackbarText: '',
                unsaved: false,
                exporting: false
            }
        },
        computed: {
            runningInElectron () {
                if (isElectron)
                    return isElectron()
                else
                    return false
            }
        },
        methods: {
            //  Handles toggling of dark mode
            async toggleDarkMode () {
                //  Store current DSL and force recreation of editor and sml
                localStorage.setItem('dsl', this.$refs.editor.getDsl())
                this.$vuetify.theme.dark = !this.$vuetify.theme.dark

                //  Persist change
                if(isElectron()) {
                    electron = await electron
                    electron.ipcRenderer.send('toggleDarkMode')
                }
                else 
                    localStorage.setItem('darkMode', this.$vuetify.theme.dark)
            },

            //  Passes drop event to the sidebar
            drop (event) {
                this.$refs.sidebar.drop(event)
            },

            //  Passes editor events to the editor
            updateEditor (dsl) {
                this.$refs.editor.updateEditor(dsl)
            },

            //  Changes the visibility of the prop editor
            updatePropVisibility () {
                this.propEditorVisible = !this.propEditorVisible
            },

            //  Opens link creation dialog (started by connecting two elements in JointJs)
            openLinkConfig () {
                this.$refs.propEditor.openLinkConfig()
            },

            noValidData () {
                this.snackbarText = 'The loaded file does not include valid SML data' 
                this.snackbarOpen = true
            },

            //  Saves current diagram to a file selected by user
            async saveAs () {
                if (this.errorState) {
                    this.snackbarText = 'You cannot save while having an error' 
                    this.snackbarOpen = true
                }
                else 
                    this.saveFileElectron(true)
            },

            //  Updates current file
            async save () {
                if (this.errorState) {
                    this.snackbarText = 'You cannot save while having an error' 
                    this.snackbarOpen = true
                }
                else {
                    if(isElectron()) {
                        if (this.currentFile) 
                            this.saveFileElectron(false)
                        else 
                            this.saveAs()
                    }
                    else {
                        this.saveFileBrowser()
                    }
                }
            },

            async saveFileElectron (saveAs) {
                //  Prepares export, tells Electron to save to a new file und uprepares the export
                this.prepareExport()
                if(isElectron()) {
                    electron = await electron
                    let data = this.getSVGContent()
                    if (data)
                        electron.ipcRenderer.send('saveFile', { path: saveAs ? undefined : this.currentFile, data })
                    else {
                        this.snackbarText = 'Sorry, an error occurred'
                        this.saved = true
                    }
                }
                this.unprepareExport()
            },

            saveFileBrowser () {
                // Handle download of file
                this.prepareExport()
                let data = this.getSVGContent()
                if (data) {
                    let downloadLink = document.createElement('a');
                    let preface = '<?xml version="1.0" standalone="no"?>\r\n';
                    let svgUrl = URL.createObjectURL(new Blob([preface, data], {type:'image/svg+xml;charset=utf-8'}));
                    downloadLink.href = svgUrl;
                    downloadLink.download = 'yourDiagram.svg';
                    document.body.appendChild(downloadLink);
                    downloadLink.click();
                    document.body.removeChild(downloadLink);
                }
                else {
                    this.snackbarText = 'Sorry, an error occurred'
                    this.snackbarOpen = true
                    this.saved = true
                }
                this.unprepareExport()
            },

            //  Removes background so that exported svg is transparent
            prepareExport () {
                this.exporting = true
                this.$refs.propEditor.initiatePropEditor()
                if (!this.$vuetify.theme.dark) {
                    this.$refs.myholder.classList.remove('jointjs-bg')
                    this.$refs.myholder.classList.add('jointjs-transparent')
                }
                this.sml.prepareExport()
            },
            
            //  Resets background to have color based on theme
            unprepareExport () {
                this.exporting = false
                this.$refs.myholder.classList.remove('jointjs-transparent')
                this.$refs.myholder.classList.add('jointjs-bg')
                this.sml.unprepareExport()
            },

            //  Imports sml.svg file
            async importSvg () {
                if(isElectron()) {
                    electron = await electron
                    electron.ipcRenderer.send('importFile')
                }
                else
                    this.$refs.fileInput.click()
            },

            //  Handles changes when file was entered by the HTML input
            handleFileChange (event) {
                //  Read file and set DSL 
                var fr = new FileReader();
                fr.onload = () => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(fr.result, 'application/xml');
                    const errorNode = doc.querySelector('parsererror');

                    //  Find correct content
                    let content
                    if (errorNode)
                        content = fr.result ?? ''
                    else
                        content = doc.querySelector('dsl')?.textContent ?? ''

                    if (!content) 
                        this.noValidData()
                    else {
                        this.updateEditor(content)
                        this.$refs.editor.parse(true)
                    }
                }
                fr.readAsText(event.target.files[0]);

                //  Reset event value to allow uploading the same file again
                event.target.value = null
            },

            //  Returns current diagram as SVG
            getSVGContent () {
                const svgDocument = elementToSVG(this.$refs.myholder)
                
                //  Create DSL element and add to doc
                const dslEle = svgDocument.createElement('dsl')
                const dslTextEle = svgDocument.createTextNode(this.$refs.editor.getDsl())
                dslEle.appendChild(dslTextEle)
                svgDocument.getElementsByTagName('svg')[0].appendChild(dslEle)

                return new XMLSerializer().serializeToString(svgDocument)
            },

            //  Resizes the editor and jointJs paper to always fit on screen
            handleResize () {
                //  Calculate current distribution of editor and jointjs
                const editorRowHeight  = this.$refs.editorRow .clientHeight + 24
                const jointjsRowHeight = this.$refs.jointjsRow.clientHeight
                const totalHeight      = editorRowHeight + jointjsRowHeight
                const editorPercent    = editorRowHeight  / totalHeight * 100
                const jointJSPercent   = jointjsRowHeight / totalHeight * 100
                
                //  Set height corresponding to calculations
                this.$refs.editorRow.style.height = 'calc(' + editorPercent + '% - 24px)'
                this.$refs.jointjsRow.style.height = jointJSPercent + '%'
            },

            //  Sets error message
            setErrorState (val) {
                this.errorState = val
            },

            //  Resizes editor and jointJs paper if dragbar is dragged
            handleDrag (e) {
                const editorRowHeight  = this.$refs.editorRow .clientHeight
                const jointjsRowHeight = this.$refs.jointjsRow.clientHeight

                if (editorRowHeight - e.movementY >= 0 && jointjsRowHeight + e.movementY >= 0) {
                    this.$refs.editorRow.style.visibility  = 'visible'
                    this.$refs.jointjsRow.style.visibility = 'visible'
                    this.$refs.editorRow.style.height  = `${editorRowHeight  - e.movementY}px`
                    this.$refs.jointjsRow.style.height = `${jointjsRowHeight + e.movementY}px`
                }
                else {
                    window.removeEventListener('mousemove', this.handleDrag)

                    //  Hide components if their height becomes 0
                    if (editorRowHeight - e.movementY >= 0)
                        this.$refs.jointjsRow.style.visibility = 'hidden'
                    if (jointjsRowHeight + e.movementY >= 0)
                        this.$refs.editorRow.style.visibility = 'hidden'
                }
            },

            //  Creates the SML component and retrieves AST
            rerenderSML () {
                if (this.sml)
                    this.sml.prepareRerender()
                this.sml = new SML(
                    this.$refs.editor.getDsl(),
                    this.$refs.myholder, 
                    this.updateEditor,
                    this.openLinkConfig,
                    this.$refs.propEditor.initiatePropEditor,
                    this.$refs.editor.showErrors,
                    this.removeLinkPropEditor,
                    this.$store.jointJSSettings,
                    this.$vuetify.theme.dark,
                    this.changeCursorPos
                )
                this.ast  = this.sml.getAst()
                this.astq = this.sml.getAstQ()
            },

            //  Changes position of editor cursor
            changeCursorPos (pos) {
                this.$refs.editor.setPosition(pos)
            },

            //  Changes data that indicates if changes were made to file
            fileChanged () {
                this.unsaved = true
            },

            //  Opens the settings of the application
            openSettings () {
                this.snackbarText = 'Not yet implemented.'
                this.snackbarOpen = true
            }
        }
    }
</script>

<style lang="scss">
    .main-row {
        padding-left: 12px;
        padding-right: 12px;
    }
    .main-row-jointjs {
        @extend .main-row;
        height: 60%; 
        position: relative;
    }
    .main-row-editor {
        @extend .main-row;
        height: calc(40% - 24px); 
        position: relative;
    }
    .jointjs-transparent {
        background-color: transparent !important;
    }
    .joint-paper {
        border-radius: 5px;
    }
    .export-loader {
        position: absolute;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        backdrop-filter: blur(1px);
        width: 100%;
        height: 100%;
    }
    .errorBox {
        border: 1px solid var(--v-red-base);
        border-radius: 5px;
        z-index: 10;
        backdrop-filter: blur(1px);
        position: absolute;
        width: calc(100% - 24px);
        height: 100%;
        margin: 0 !important;
    }
    .button-scale{
        position: absolute;
        z-index: 10;
        right: 12px;
    }
    .dragger {
        width: 100%;
        height: 24px; 
        display: flex; 
        align-items: center; 
        align-content: center; 
        position: relative; 
        cursor: n-resize;
        &-icon {
            width: 100%; 
            height: 24px;
            display: flex; 
            align-items: center; 
            align-content: center; 
            position: relative; 
            cursor: n-resize;
        }
    }
    .prop-editor {
        max-width: 360px;
    }
</style>

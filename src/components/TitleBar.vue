<template>
    <div class="title-bar" :style="titleBarBorder">
        <div class>
            <h3 class="pl-2 pt-1">Simple Modeling Language</h3>
        </div>

        <div>
            {{ fileText }}
        </div>

        <div>
            <v-btn icon tile class="frame-control" @click="minimize">
                <v-icon>mdi-window-minimize</v-icon>
            </v-btn>

            <v-btn icon tile class="frame-control" @click="maximize" v-if="!windowMaximized">
                <v-icon>mdi-window-maximize</v-icon>
            </v-btn>

            <v-btn icon tile class="frame-control" @click="maximize" v-if="windowMaximized">
                <v-icon>mdi-window-restore</v-icon>
            </v-btn>

            <v-btn icon tile class="frame-control close" @click="close">
                <v-icon>mdi-window-close</v-icon>
            </v-btn>
        </div>
    </div>
</template>

<script>
    import isElectron from 'is-electron'
    let electron
    if (isElectron())
        electron = import('electron')

    export default {
        name: 'TitleBar',
        components: {},
        props: [ 'currentFile', 'unsaved' ],
        data () {
            return {
                windowMaximized: null
            }
        },
        computed: {
            //  Determines whether unsaved is concatenated to file path or not
            fileText () {
                let fileText = ''
                if (this.currentFile) {
                    fileText += this.currentFile
                    if (this.unsaved)
                        fileText += ' - Unsaved'
                }
                return fileText
            },

            //  Returns border color, required to overwrite vuetify setting
            titleBarBorder () {
                return `border-bottom: 1px solid ${this.$vuetify.theme.dark ?
                    this.$vuetify.theme.themes.dark.border : this.$vuetify.theme.themes.light.border} !important;`
            }
        },
        async mounted () {
            //  Request the maximization status of the window and handle the answer
            if (isElectron()){
                electron = await electron
                electron.ipcRenderer.send('windowStatus')
                electron.ipcRenderer.on('windowStatus', (event, data) => {
                    this.windowMaximized = data
                })
            }
        },
        methods: {
            //  Sends message to electron to minimize
            minimize () {
                electron.ipcRenderer.send('minimize')
            },

            //  Sends message to electron to maximize or unmaximize
            maximize () {
                if (this.windowMaximized)
                    electron.ipcRenderer.send('unmaximize')
                if (!this.windowMaximized)
                    electron.ipcRenderer.send('maximize')
                this.windowMaximized = !this.windowMaximized
            },

            //  Sends message to electron to close
            close () {
                electron.ipcRenderer.send('close')
            },

            //  Request window status from electron on resize event
            getWindowStatus () {
                electron.ipcRenderer.send('windowStatus')
            }
        },
        created() {
            window.addEventListener('resize', this.getWindowStatus);
        },
        destroyed() {
            window.removeEventListener('resize', this.getWindowStatus);
        },
    }
</script>

<style>
    .title-bar {
        width: 100%;
        height: 32px;
        position: absolute;
        top: 0;
        z-index: 99999;
        -webkit-app-region: drag;
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    .frame-control {
        -webkit-app-region: no-drag;
        height: 31px !important;
        width: 32px !important;
        padding-left: 22px !important;
        padding-right: 22px !important;
    }
    .close:hover {
        color: var(--v-white-base) !important;
        background-color: var(--v-red-darken2);
    }
</style>

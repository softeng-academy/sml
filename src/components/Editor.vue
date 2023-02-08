<template>
    <div class="editor-container">
        <v-tooltip top>
            <template #activator="{ on, attrs }">
                <v-btn class="editor-container-format-btn" icon dense v-bind="attrs" v-on="on" @click="format">
                    <v-icon>
                        mdi-format-list-text
                    </v-icon>
                </v-btn>
            </template>

            <span>
                Format Text
            </span>
        </v-tooltip>

        <div ref="editor" class="editor-container-editor"/>
    </div>
</template>

<script>
    import * as monaco from 'monaco-editor'

    export default {
        name: 'Editor',
        props: [ 'sml', 'autoFormatting' ],
        data () {
            return {
                editor: null,
                dsl: null,
                UIUpdate: false,
                timerRunning: false,
                parsingTimeout: null,
                modelMarkers: [],
                modelMarkerTimeout: null,
                exampleDSL: `OrgUnit:entity @pos(10,5) {
        id:string
        initials:string
        name:string
        parentUnit:OrgUnit [0..1] @dock("lm","tm")
        director:Person @dock("bm","bm")
        members:Person [0..n] @dock("rb","lb")
    }

    Person:entity @pos(45,5) {
        id:string
        initials:string
        name:string
        belongsTo:OrgUnit @dock("lt","rt")
        supervisor:Person [0..1] @dock("rm","tr")
    }`
            }
        },
        mounted () {
            //  Set DSL and load editor
            this.dsl = localStorage.getItem('dsl') || this.exampleDSL
            localStorage.removeItem('dsl')
            this.editorSetup()

            //  Register content change listener
            this.editor.getModel().onDidChangeContent(() => {
                //  Reset markers
                monaco.editor.setModelMarkers(this.editor.getModel(), 'owner', [])
                this.$emit('setErrorState', false)

                //  Only update if its origin is from the editor and not a change in the UI
                //  to avoid infinite loop
                if (!this.UIUpdate) {
                    this.editorChanged = true
                    this.dsl = this.editor.getValue()
                    this.parse()
                }
                this.UIUpdate = false
            })
        },
        watch: {
            //  Triggers autoFormatting once sml is initialized
            sml (newVal) {
                if (newVal && this.autoFormatting)
                    this.format()
            },
        },

        methods: {
            //  On change event of editor, initiates timer to update AST
            parse (firstRender) {
                if (!this.timerRunning) {
                    //  No changes in the last 500ms
                    this.timerRunning = true
                    this.parsingTimeout = setTimeout(this.execUpdate, 500)

                    //  Only emit file changed event if its not the first render
                    if (!firstRender)
                        this.$emit('fileChanged')
                } 
                else {
                    //  DSL was changed 500ms before
                    //  Clear current timer and reset
                    clearTimeout(this.parsingTimeout)
                    this.parsingTimeout = setTimeout(this.execUpdate, 500)
                }
            },

            //  Actual method to send DSL to the SML library, either with formatting of without
            execUpdate () {
                this.timerRunning = false
                if (this.autoFormatting)
                    this.format()
                else
                    this.sml.updateDSL(this.dsl)
            },

            //  Handles updates of editor from UI
            updateEditor (dsl) {
                if (this.editor && this.dsl !== dsl) {
                    this.dsl = dsl
                    //  If DSL changed from update, file should be saved
                    this.$emit('fileChanged')
               
                    this.UIUpdate = true
                    const saveCursorPos = this.editor.getPosition()

                    //  Injects new dsl into editor to maintain undo stack
                    const fullRange = this.editor.getModel().getFullModelRange();
                    this.editor.executeEdits(null, [{
                        text: this.dsl,
                        range: fullRange
                    }]);
                    this.editor.pushUndoStop();

                    //  Force tokenization to disallow flickering
                    const model = this.editor.getModel()
                    model.forceTokenization(model.getLineCount())

                    //  Resets model marker every 250ms
                    clearTimeout(this.modelMarkerTimeout)
                    this.modelMarkerTimeout = setTimeout(() => monaco.editor.setModelMarkers(this.editor.getModel(), 'owner', this.modelMarkers), 250)
                    
                    //  Set position to where it was before
                    if (saveCursorPos)
                        this.editor.setPosition(saveCursorPos)
                }

                //  Stop looping rendering
                this.editorChanged = false
            },

            //  Formats DSL before parsing
            format () {
                if (this.sml)
                    this.sml.formatText()
            },

            //  Sets cursor position
            setPosition (pos) {
                this.editor.setPosition(pos)
                document.querySelectorAll('textarea')[0].blur()
            },

            getDsl () {
                return this.dsl
            },

            //  Initializes Monaco editor and defines SML language
            editorSetup () {
                //  Register sml language if not already registered
                if (!monaco.languages.getLanguages().find((lang) => lang.id == 'sml')) {
                    monaco.languages.register({ id: 'sml' })
    
                    //  Register sml token provider
                    monaco.languages.setMonarchTokensProvider('sml', {
                        tokenizer: {
                            root: [
                                [ /\bentity\b|\bstate\b|\blayer\b|\bslice\b|\btype\b|\benumeration\b/g, 'boxType' ],
                                [ /\bint\b|\bstring\b|\bboolean\b/g, 'attributeType' ],
                                [ /@[a-zA-Z]*/g, 'tag' ],
                                [ /{|}|\(|\)|\[|\]/g, 'bracket' ],
                                [ /((\*|[0-9]+|[a-zA-Z])\.\.(\*|[0-9]+|[a-zA-Z]))|\*|\+|\?/g, 'cardinality' ],
                                { include: '@whitespace' }
                            ],
                            comment: [
                                [ /[^/*]+/, 'comment' ],
                                [ /\/\*/, 'comment', '@push' ],
                                [ '\\*/', 'comment', '@pop' ],
                                [ /[/*]/, 'comment' ]
                            ],
                            whitespace: [
                                [ /[ \t\r\n]+/, 'white' ],
                                [ /\/\*/, 'comment', '@comment' ],
                                [ /\/\/.*$/, 'comment' ]
                            ]
                        }
                    })

                    //  Register completion item provider for sml
                    monaco.languages.registerCompletionItemProvider('sml', {
                        provideCompletionItems: () => {
                            const suggestions = [
                                {
                                    label: 'new box',
                                    kind: monaco.languages.CompletionItemKind.Keyword,
                                    //  eslint-disable-next-line
                                    insertText: 'name:boxType {\n\t\n}',
                                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                                    documentation: 'Template to create a new entity'
                                },
                                {
                                    label: '1..*',
                                    kind: monaco.languages.CompletionItemKind.Text,
                                    insertText: '1..*'
                                },
                                {
                                    label: 'entity',
                                    kind: monaco.languages.CompletionItemKind.Text,
                                    insertText: 'entity {\n}',
                                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
                                },
                                {
                                    label: 'state',
                                    kind: monaco.languages.CompletionItemKind.Text,
                                    insertText: 'state {\n}',
                                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
                                },
                                {
                                    label: 'layer',
                                    kind: monaco.languages.CompletionItemKind.Text,
                                    insertText: 'layer {\n}',
                                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
                                },
                                {
                                    label: 'slice',
                                    kind: monaco.languages.CompletionItemKind.Text,
                                    //  eslint-disable-next-line
                                    insertText: 'slice {\n    ${1: content}\n}',
                                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
                                },
                                {
                                    label: 'type',
                                    kind: monaco.languages.CompletionItemKind.Text,
                                    insertText: 'type {\n}',
                                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
                                },
                                {
                                    label: 'string',
                                    kind: monaco.languages.CompletionItemKind.Text,
                                    insertText: 'string'
                                }
                            ]
                            return { suggestions: suggestions }
                        }
                    })
                }

                //  Define rules for sml
                monaco.editor.defineTheme('smlTheme', {
                    base: this.$vuetify.theme.dark ? 'vs-dark' : 'vs',
                    inherit: true,
                    rules: [
                        { token: 'boxType', foreground: 'B07F1F', fontStyle: 'bold' },
                        { token: 'attributeType', foreground: '268bd2', fontStyle: 'bold' },
                        { token: 'tag', foreground: '889CAE' },
                        { token: 'bracket', foreground: '268bd2' },
                        { token: 'cardinality', foreground: 'B07F1F', fontStyle: 'bold' },
                        { token: 'comment', foreground: '888888' }
                    ],
                    colors: {}
                })
                
                //  Create editor
                this.editor = monaco.editor.create(this.$refs.editor, {
                    value: this.dsl,
                    theme: 'smlTheme',
                    language: 'sml',
                    automaticLayout: true,
                    autoClosingBrackets: true,
                    autoClosingQuotes: true,
                })
                this.editor.getModel().updateOptions({ tabSize: 4 })

                this.$emit('editorReady')
            },

            //  Reads warning and errors from parser and sets the corresponding markers
            showErrors (warnings, errors) {
                const modelMarkers = []

                //  Globally set error state if errors are present
                if (errors?.length > 0)
                    this.$emit('setErrorState', true)
                
                //  Add warnings to markers
                if (warnings) {
                    warnings.forEach(warning => {
                        modelMarkers.push(
                            {
                                startLineNumber: warning.line,
                                startColumn: warning.column,
                                endLineNumber: warning.line,
                                endColumn: warning.column + warning.length,
                                message: warning.message,
                                severity: monaco.MarkerSeverity.Warning
                            })
                    })
                }

                //  Add errors to markers
                if (errors) {
                    errors.forEach(error => {
                        modelMarkers.push(
                            {
                                startLineNumber: error.line,
                                startColumn: error.column,
                                endLineNumber: error.line,
                                endColumn: error.column + error.length,
                                message: error.message,
                                severity: monaco.MarkerSeverity.Error
                            })
                    })
                }

                //  Update model markers in editor to make them visible
                if (this.editor && modelMarkers.length > 0) { 
                    this.modelMarkers = modelMarkers
                    monaco.editor.setModelMarkers(this.editor.getModel(), 'owner', this.modelMarkers) 
                }
                else 
                    this.modelMarkers = []
            },

            //  Triggers undo on global event
            undo () {
                this.editor.trigger('sml', 'undo')
                document.querySelectorAll('textarea')[0].blur()
            },

            //  Triggers redo on global event
            redo () {
                this.editor.trigger('sml', 'redo')
                document.querySelectorAll('textarea')[0].blur()
            }
        }
    }
</script>

<style lang="scss">
    .editor-container {
        height: 100%; 
        width: 100%; 
        position: relative;
        &-editor {
            width: 100%;
            height: 100%;
            z-index: 20;
            position: absolute;
            top:0;
        }
        &-format-btn {
            position: absolute;
            top: 0;
            z-index: 9999;
            margin-top: -4px;
            margin-left: -4px
        }
    }
    .monaco-editor {
        border-radius: 5px;
    }
    .overflow-guard {
        border-radius: 5px;
    }
</style>

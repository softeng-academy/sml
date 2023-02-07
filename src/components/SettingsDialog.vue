<template>
    <v-dialog
        v-model="display"
        max-width="90%"
        @click:outside="saveAndCloseSettings"
    >
        <v-card>
            <v-card-title class="text-h5">
                <v-spacer/>Settings<v-spacer/>
            </v-card-title>

            <v-card-text class="height-70">
                <v-tabs
                    v-model="tab"
                    fixed-tabs
                >
                    <v-tab>
                        Sidebar
                    </v-tab>
                </v-tabs>

                <v-tabs-items v-model="tab">
                    <v-tab-item key="1">
                            <div class="row">
                                <div class="col-3"/>

                                <div class="col-3">
                                    <h3>Quick Access Bar</h3>

                                    <draggable class="list-group" :class="{dropzone: dragged}" :list="quickAccess" group="quickAccessItems" @start="dragged=true" @end="dragged=false">
                                        <div
                                        class="list-group-item"
                                        v-for="(element) in quickAccess"
                                        :key="element.name"
                                        >
                                            <div v-html="images[lightOrDark][element.name]" class="preview-image"/> {{ element.name }}
                                        </div>
                                    </draggable>
                                </div>

                                <div class="col-3">
                                    <h3>Available Elements</h3>
                                    
                                    <draggable class="list-group" :class="{dropzone: dragged}" :list="unusedItems" group="quickAccessItems" @start="dragged=true" @end="dragged=false">
                                        <div
                                        class="list-group-item"
                                        v-for="(element) in unusedItems"
                                        :key="element.name"
                                        >
                                            <div v-html="images[lightOrDark][element.name]" class="preview-image"/>{{ element.name }} 
                                        </div>
                                    </draggable>
                                </div>
                            </div>
                    </v-tab-item>
                </v-tabs-items>
            </v-card-text>

            <v-card-actions>
                <v-spacer/>

                <v-btn @click="saveAndCloseSettings" plain color="primary">Save</v-btn>

                <v-btn @click="closeSettings" plain color="danger">Cancel</v-btn>

                <v-spacer/>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
    import draggable from 'vuedraggable'
    import {images} from '../resources/images/boxTypes'

    export default {
        components: {draggable},
        name: 'SettingsDialog',
        props: ['selectedElems'],
        computed: {
            lightOrDark () {
                return this.$vuetify.theme.dark ? 'light' : 'dark'
            }
        },
        data() {
            return {
                display: true,
                dragged: false,
                images: images,
                tab: null,
                quickAccess: this.selectedElems.map(elem => {return {name: elem}}),
                //  Default state: only contains the possible quick access elements that are not currently in the quick access bar
                unusedItems: ['entity', 'layer', 'slice', 'state', 'type'].filter(elem => !this.selectedElems.includes(elem)).map(elem => {return {name: elem}})
            }
        },
        methods: {
            closeSettings() {
                this.$emit('closeSettings')
            },
            saveAndCloseSettings() {
                this.$emit('quickAccessChange', this.quickAccess.map(elem => elem.name))
            }
        }
    }
</script>
<style scoped>
    .preview-image {
        width:30px;
        height:30px;
    }
    .list-group {
        min-height: 40vh;
        margin-top: 1em;
        padding: 4px;
    }
    .dropzone {
        border: dashed;
        border-radius: 5px;
        border-width: 2px;
        padding: 2px;
    }
    .list-group-item{
        display: flex;
        align-items: center;
        border: solid;
        border-radius: 13px;
        border-width: 1px;
        margin: 1em;
        margin-top: 0em;
        cursor: grab
    }
    .height-70 {
        height: 70vh
    }
</style>
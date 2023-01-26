<template>
    <v-navigation-drawer
        permanent
        absolute
        class="v-d-flex v-flex-column v-full-height side-bar"
    >
        <v-list-item  class="pa-0">
            <div class="side-bar-text"> 
                Files 
            </div>
        </v-list-item>

        <v-list-item class="side-bar-icon">
            <v-btn icon @click="save">
                <v-icon>
                    mdi-content-save
                </v-icon>
            </v-btn>
        </v-list-item>

        <v-list-item class="side-bar-icon" v-if="runningInElectron">
            <v-btn icon @click="saveAs">
                <v-icon>
                    mdi-content-save-cog
                </v-icon>
            </v-btn>
        </v-list-item>

        <v-list-item class="side-bar-icon">
            <v-btn icon @click="importSvg">
                <v-icon>
                    mdi-file-upload-outline
                </v-icon>
            </v-btn>
        </v-list-item>

        <v-divider/>

        <v-list-item class="pa-0">
            <div class="side-bar-text">
                Quick Access
            </div>
        </v-list-item>

        <SideBarIcon v-for="elem in availableElements" v-bind:key="elem" :elemName="elem" @sidebarIconChanged="setCurrentlyDragged"></SideBarIcon>

        <template #append>
            <v-divider/>

            <v-list-item class="side-bar-icon">
                <v-btn icon @click="updatePropVisibility">
                    <v-icon>mdi-arrow-split-vertical</v-icon>
                </v-btn>
            </v-list-item>
            
            <v-list-item class="side-bar-icon">
                <v-btn icon @click="toggleDarkMode">
                    <v-icon>mdi-theme-light-dark</v-icon>
                </v-btn>
            </v-list-item>

            <v-list-item class="side-bar-icon">
                <v-btn icon @click="openSettings">
                    <v-icon>mdi-cog</v-icon>
                </v-btn>
            </v-list-item>
        </template>
    </v-navigation-drawer>
</template>

<script>
    import isElectron from 'is-electron'
    import { images } from '../resources/images/boxTypes'
    import SideBarIcon from './SideBarIcon.vue'

    export default {
        name: 'SideBar',
        props: [ 'sml' ],
        components: {
            SideBarIcon
        },
        data () {
            return {
                currentlyDragged: undefined,
                images: images,
                availableElements: ['entity', 'layer', 'slice', 'state', 'type']
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
            //  Adds new element to the AST
            drop (event) {
                this.sml.dropNewElem(event.clientX, event.clientY, this.currentlyDragged)
            },

            //  Set currently dragged node
            setCurrentlyDragged (draggedName) {
                this.currentlyDragged = draggedName
            },

            //  Changes the visibility of the prop editor
            updatePropVisibility () {
                this.$emit('updatePropVisibility')
            },

            toggleDarkMode () {                
                this.$emit('toggleDarkMode')
            },

            //  Saves current diagram to new file
            saveAs () {
                this.$emit('saveAs')
            },

            //  Imports diagram from file
            importSvg () {
                this.$emit('importSvg')
            },

            //  Saves update to currently opened file
            save () {
                this.$emit('save')
            },
            
            //  Opens the settings
            openSettings () {
                this.$emit('openSettings')
            }
        }
    }
</script>

<style lang="scss">
    .side-bar {
        width: 56px !important; 
        &-text {
            font-size: 11px;
            text-align: center;
            width: 100%;
            border: 0;
        }
        &-icon {
            justify-content: center;
            padding: 0;
        }
    }
    .svg-container {
        display: flex;
        justify-content: center;
        padding-top: 16px;
        padding-bottom: 16px;
    }
</style>

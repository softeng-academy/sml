<template>
    <div 
        v-html="images[lightOrDark][elemName]" 
        draggable="true" 
        class="svg-container grab"
        @dragstart="$emit('sidebarIconChanged', elemName)"
        @dragend="$emit('sidebarIconChanged', undefined)"
    ></div>
</template>

<script>
    import { images } from '../resources/images/boxTypes'
    export default {
        name: 'SideBarIcon',
        props: {
            elemName: String
        },
        data () {
            return {
                images: images
            }
        },
        computed: {
            lightOrDark () {
                return this.$vuetify.theme.dark ? 'light' : 'dark'
            }
        }
    }
</script>

<style>
    .grab{
        cursor: grab
    }
</style>
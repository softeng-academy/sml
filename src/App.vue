<template>
    <v-app>
        <MainView/>
    </v-app>
</template>

<script>
    import MainView from './views/MainView'

    export default {
        name: 'App',
        components: {
            MainView
        }
    }
</script>

<style>
@import '~jointjs/dist/joint.min.css';
.main {
    overflow-y: auto;
}
</style>

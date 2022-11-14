import Vue      from 'vue'
import Vuetify  from 'vuetify'
import               '../node_modules/jointjs/css/layout.css'

import App      from './App.vue'

Vue.use(Vuetify)

Vue.prototype.$store = Vue.observable({
    autoFormatting: false,
    jointJSSettings: {
        lineBreaking: true
    }
})
Vue.prototype.$actions = {
    toggleAutoFormatting () {
        this.$store.autoFormatting = !this.$store.autoFormatting
    }
}

Vue.config.productionTip = false

new Vue({
    vuetify:    new Vuetify({
        theme: {
            dark: false,
            options: {
                customProperties: true
            },
            themes: {
                light: {
                    primary:      '#B07F1F',
                    secondary:    '#268bd2',
                    'title-bar':  '#E5E5E5',
                    'side-bar':   '#E5E5E5',
                    'jointjs-bg': '#FFFFFF',
                    background:   '#F5F5F5',
                    red:          '#F44336',
                    white:        '#FFFFFF',
                    border:       '#C9C9C9',
                },
                dark: {
                    primary:      '#B07F1F',
                    secondary:    '#268bd2',
                    'title-bar':  '#363636',
                    'side-bar':   '#363636',
                    'jointjs-bg': '#1e1e1e',
                    background:   '#000000',
                    red:          '#F44336',
                    white:        '#FFFFFF',
                    border:       '#4E4E4E',
                }
            } 
        }
    }),
    render:     h => h(App)
}).$mount('#app')

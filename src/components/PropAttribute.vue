<template>
    <v-row align="center">
        <v-col cols="5" class="pt-0">
            <v-text-field
                @input="$emit('changeAttributeLabel', { label, id })"
                v-model="label"
                hide-details="auto"
                dense
            >
            </v-text-field>
        </v-col>

        <v-col cols="5" class="pt-0">
            <v-select
                @input="$emit('changeAttributeType', { selectedType, id })"
                v-model="selectedType"
                :items="possibleTypes"
                hide-details="auto"
                dense
            >
            </v-select>
        </v-col>

        <v-col cols="2" class="pt-0">
            <v-btn @click="$emit('removeAttribute', id)" icon>
                <v-icon>
                    mdi-delete
                </v-icon>
            </v-btn>
        </v-col>
    </v-row>
</template>

<script>
    export default {
        name: 'PropAttribute',
        components: {},
        props: [ 'attributeLabel', 'type', 'id' ],
        data () {
            return {
                label: this.attributeLabel,
                selectedType: this.type,
                possibleTypes: [ 'string', 'int' ]
            }
        }
    }
</script>

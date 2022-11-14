<template>
    <div>
        <v-row align="center" class="pl-4">
            <v-col cols="5" class="pt-0">
                <v-select
                    label="To"
                    @input="$emit('targetChanged', { id: tag.id, targetElem })"
                    v-model="targetElem"
                    :items="possibleTargets"
                    item-value="label"
                    item-text="label"
                >
                </v-select>
            </v-col>

            <v-col cols="5" class="pt-0">
                <v-text-field
                    hide-details="auto"
                    dense
                    @input="$emit('changeLinkLabel', { label, id })"
                    v-model="label"
                >
                </v-text-field>
            </v-col>

            <v-col cols="1" class="pt-0">
                <v-btn icon @click="show = !show">
                    <v-icon>{{ show ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
                </v-btn>
            </v-col>
        </v-row>

        <v-expand-transition>
            <div v-show="show">
                <v-row align="center" class="pl-4">
                    <v-col cols="3">
                        <v-select
                            item-value="id"
                            :items="dockIcons"
                            v-model="selectedStartDock"
                            @input="$emit('portsChanged', { id, startDock, targetDock, selectedStartDock, selectedTargetDock })"
                            label="Source Dock"
                        >
                            <template #item="{ item }">
                                <v-icon>{{ item.icon }}</v-icon>
                            </template>

                            <template #selection = "{ item }">
                                <v-icon>{{ item.icon }}</v-icon>
                            </template>
                        </v-select>
                    </v-col>

                    <v-col cols="3">
                        <v-select
                            item-value="id"
                            :items="dockIcons"
                            v-model="selectedTargetDock"
                            @input="$emit('portsChanged', { id, startDock, targetDock, selectedStartDock, selectedTargetDock })"
                            label="Target Dock"
                        >
                            <template #item="{ item }">
                                <v-icon>{{ item.icon }}</v-icon>
                            </template>

                            <template #selection="{ item }">
                                <v-icon>{{ item.icon }}</v-icon>
                            </template>
                        </v-select>
                    </v-col>

                    <v-col cols="4">
                        <v-select
                            :items="possibleTags"
                            v-model="selectedTag"
                            @input="$emit('tagChanged', { id: tag.id, linkId: id, selectedTag })"
                            label="Connection Type"
                        >
                        </v-select>
                    </v-col>

                    <v-col cols="1">
                        <v-btn @click="$emit('removeLink', id)" icon>
                            <v-icon>mdi-delete</v-icon>
                        </v-btn>
                    </v-col>
                </v-row>
            </div>
        </v-expand-transition>
    </div>
</template>

<script>
    export default {
        name: 'PropLink',
        components: {},
        props: [ 'id', 'linkLabel', 'type', 'startDock', 'targetDock', 'tag', 'possibleTargets' ],
        data () {
            return {
                show:               false,
                label:              this.linkLabel,
                sDock:              this.startDock,
                tDock:              this.targetDock,
                selectedStartDock:  this.startDock,
                selectedTargetDock: this.targetDock,
                selectedTag:        this.tag.name,
                selectedType:       this.type,
                targetElem:         this.type,
                possibleDocks: [ '"lb"', '"lm"', '"lt"', '"rb"', '"rm"', '"rt"', '"tl"', '"tm"', '"tr"', '"bl"', '"bm"', '"br"' ],
                possibleTags:  [ 'compose', 'dock', 'inherit' /*, 'call', 'call-back', 'one-way', 'ordered', 'unique' */ ],
                dockIcons: [
                    { icon: 'mdi-arrow-bottom-left',  id: '"lb"' }, 
                    { icon: 'mdi-arrow-left',         id: '"lm"' }, 
                    { icon: 'mdi-arrow-top-left',     id: '"lt"' }, 
                    { icon: 'mdi-arrow-bottom-right', id: '"rb"' }, 
                    { icon: 'mdi-arrow-right',        id: '"rm"' }, 
                    { icon: 'mdi-arrow-top-right',    id: '"rt"' },
                    { icon: 'mdi-arrow-top-left',     id: '"tl"' }, 
                    { icon: 'mdi-arrow-up',           id: '"tm"' }, 
                    { icon: 'mdi-arrow-up',           id: '"tm"' }
                ]
            }
        }
    }
</script>

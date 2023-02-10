<template>
    <div class="prop-container">
        <v-card v-if="currentNode" class="prop-container-card elevation-0">
            <v-container>
                <v-row>
                    <v-col cols="5" class="pb-0">
                        <v-text-field
                            @input="applyNameChange"
                            v-model="props.name"
                            label="Element name"
                        >
                        </v-text-field>
                    </v-col>

                    <v-col cols="5" class="pb-0">
                        <v-select
                            v-model="props.type"
                            :items="possibleTypes"
                            @change="typeChanged"
                            label="Type"
                        >
                        </v-select>
                    </v-col>

                    <v-col cols="1" class="pb-0 vertical-center">
                        <v-btn @click="removeElement" icon>
                            <v-icon>mdi-delete</v-icon>
                        </v-btn>
                    </v-col>
                </v-row>

                <v-row align="center">
                    <v-col cols="12" class="pb-0 pt-0 pl-1 horizontal-flexBox">
                        <v-btn @click="addAttrPropDialog = true" icon>
                            <v-icon>
                                mdi-plus
                            </v-icon>
                        </v-btn>

                        <v-card-text class="text-subtitle-1 font-weight-bold pb-0 pt-0">
                            Attributes
                        </v-card-text>
                    </v-col>
                </v-row>

                <PropAttribute
                    v-for="attribute in props.attributes"
                    :key="attribute.id"
                    :id="attribute.id"
                    :attributeLabel="attribute.label"
                    :type="attribute.type"
                    @changeAttributeType="changeAttributeType"
                    @removeAttribute="removeAttribute"
                    @changeAttributeLabel="renameAttribute"
                />
                
                <v-divider class="mt-3"/>

                <v-row align="center">
                    <v-col cols="12" class="pb-0 pl-1 horizontal-flexBox">
                        <v-btn @click="addLinkPropDialog = true" icon>
                            <v-icon>
                                mdi-plus
                            </v-icon>
                        </v-btn>

                        <v-card-text class="text-subtitle-1 font-weight-bold">Links</v-card-text>
                    </v-col>
                </v-row>

                <PropLink
                    v-for="link in props.links"
                    @targetChanged="changeTarget"
                    @changeLinkLabel="renameLink"
                    @tagChanged="changeTag"
                    @removeLink="removeLink"
                    @portsChanged="changeDocks"
                    :key="link.id"
                    :id="link.id"
                    :linkLabel="link.label"
                    :type="link.type"
                    :startDock="link.startDock"
                    :targetDock="link.targetDock"
                    :tag="link.tag"
                    :possibleTargets="possibleTargets"
                />
            </v-container>
        </v-card>

        <v-dialog v-model="addLinkPropDialog" width="500">
            <v-card>
                <v-card-title class="text-h5">
                    Add link
                </v-card-title>

                <v-divider/>

                <v-card-text>
                    <v-select
                        label="Target element"
                        :items="possibleTargets"
                        item-text="label"
                        v-model="targetElem"
                        required
                    />

                    <v-text-field label="Association Name" required v-model="associationName"/>

                    <v-text-field label="Cardinality" required v-model="cardinality"/>
                </v-card-text>

                <v-divider/>

                <v-card-actions>
                    <v-spacer/>

                    <v-btn color="primary" text @click="addLink">
                        Accept
                    </v-btn>

                    <v-btn color="danger" text @click="addLinkPropDialog = false">
                        Abort
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog
            v-model="addAttrPropDialog"
            width="500"
        >
            <v-card>
                <v-card-title class="text-h5">
                    Add attribute
                </v-card-title>

                <v-divider/>

                <v-card-text>
                    <v-text-field label="Label" required v-model="label"/>

                    <v-text-field label="Type" required v-model="type"/>
                </v-card-text>

                <v-divider/>

                <v-card-actions>
                    <v-spacer/>

                    <v-btn color="primary" text @click="addAttr">
                        Accept
                    </v-btn>

                    <v-btn color="danger" text @click="addAttrPropDialog = false">
                        Abort
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="dialog" width="500">
            <v-card>
                <v-card-title class="text-h5">Link Properties</v-card-title>

                <v-divider/>

                <v-card-text>
                    <v-text-field label="Association Name" required v-model="associationName"/>

                    <v-text-field label="Cardinality" required v-model="cardinality"/>
                </v-card-text>

                <v-divider/>

                <v-card-actions>
                    <v-spacer/>

                    <v-btn color="primary" text @click="acceptConfig">Accept</v-btn>

                    <v-btn color="danger" text @click="abortConfig">Abort</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script>
    import PropLink      from '../components/PropLink'
    import PropAttribute from '../components/PropAttribute'

    export default {
        name: 'PropEditor',
        components: { PropLink, PropAttribute },
        props: [ 'astq', 'ast', 'sml' ],
        data () {
            return {
                associationName: '',
                addAttrPropDialog: false,
                addLinkPropDialog: false,
                cardinality: '',
                currentNode: null,
                dialog: false,
                label: '',
                props: {
                    name: '',
                    links: [],
                    attributes: [],
                    id: '',
                    type : ''
                },
                possibleTypes: [ 'entity', 'slice', 'layer', 'state' ],
                targetElem: '',
                type: ''
            }
        },
        computed: {
            //  Get all elements' type for a list of possible link targets
            possibleTargets () {
                if (this.ast) {
                    const possibleTargets = []
                    const elements = this.astq.query(this.sml.getAst(), `// Element [ * / Spec && / Signature ]`)
                    elements.forEach((elem) => {
                        possibleTargets.push({ label: elem.child(0)?.get('label'), id: elem.child(0)?.get('id') })
                    })
                    return possibleTargets
                } 
                else 
                    return [ 'no' ]
            }
        },
        methods: {
            //  Link creation (started by connecting elems in JointJs) dialog is closed and cached data is deleted
            abortConfig () {
                this.dialog = false
                this.sml.abortAddingLink()
            },

            //  Link creation dialog is closed and a new link is added to the AST
            acceptConfig () {
                this.dialog = false
                if(this.cardinality.trim() === '')
                    this.cardinality = ''
                else if (!this.cardinality.match(/^\*|\?|\+$/))
                    this.cardinality = `[${this.cardinality}]`
                this.sml.addLinkWithConfig(this.associationName, this.cardinality)
            },

            //  Attribute creation dialog is closed and a new attribute is added to the AST
            addAttr () {
                this.addAttrPropDialog = false
                this.sml.addAttrFromPropEditor(this.currentNode, { label: this.label, type: this.type })
                this.label = ''
                this.type  = ''
            },

            //  Link creation (started by clicking + button) dialog is closed and and new link is added to AST
            addLink () {
                this.addLinkPropDialog = false

                //  If the cardinality is not * brackets are added
                if (!this.cardinality.match(/^\*|\?|\+$/) && this.cardinality.trim() !== '')
                    this.cardinality = `[${this.cardinality}]`
            
                this.sml.addLinkFromPropEditor(this.currentNode, 
                    { targetElem: this.targetElem, label: this.associationName, cardinality: this.cardinality })
                this.targetElem      = ''
                this.associationName = ''
                this.cardinality     = ''
            },

            //  Element name is changed
            applyNameChange () {
                this.sml.applyNameChange(this.currentNode, this.props.name)
            },

            //  Type of attribute is changed
            changeAttributeType (payload) {
                this.sml.changeAttributeType(payload.id, payload.selectedType)
            },

            //  Docks of a link are changed
            changeDocks (payload) {
                this.sml.changeDocks(payload.id, payload.startDock, payload.targetDock, 
                    payload.selectedStartDock, payload.selectedTargetDock, this.currentNode)
            },

            //  Link-tag is changed. E.g.: "inherit" to "call"
            changeTag (payload) {
                this.sml.changeTag(payload.id, payload.selectedTag)
            },

            //  Link type (its target) is changed
            changeTarget (payload) {
                this.sml.changeTarget(payload.id, payload.targetElem)
            },

            //  Prop editor is initiated and raw SML data is transformed into a shallow presentation data model
            initiatePropEditor (currentNode) {
                //  Get position of node and emit event to main or close prop editor
                if (currentNode) {
                    this.currentNode = currentNode

                    //  Get raw attribute nodes
                    let attributes = this.astq.query(currentNode, `/ Spec / Element [ ! */ Spec ]`)

                    //  Separate links from attributes
                    const links = []
                    attributes.forEach(attribute => {
                        //  If elements with the same type exist, the attribute is a link. It iss removed from attribbutes and added to links
                        const elementsOfSameType = this.astq.query(this.sml.getAst(), `// Element [ */ Spec && / Signature [ @label == {label} ] ]`, {label: attribute.child(0)?.get('type')})
                        if (elementsOfSameType.length > 0) {
                            links.push(attribute)
                            attributes = attributes.filter((x) => x !== attribute)
                        }
                    })

                    //  Transform the raw link data into a managebale data-structure
                    const newLinks = []
                    links.forEach(rawLink => {
                        const id =  rawLink.child(0)?.get('id')
                        const tag = rawLink.child(0)?.child(0)
                        const tagBundled = { id: tag.get('id'), name: tag.get('name') }
                        const newLink = {
                            type:  rawLink.child(0)?.get('type'),
                            label: rawLink.child(0)?.get('label'),
                            id: id,
                            startDock:  tag.get('args')[0],
                            targetDock: tag.get('args')[1],
                            tag: tagBundled
                        }
                        newLinks.push(newLink)
                    })

                    //  Transform the raw attributes into a managable data-structure
                    const newAttributes = []
                    attributes.forEach((rawAttribute) => {
                        const attribute = {
                            id:    rawAttribute.child(0)?.get('id'),
                            label: rawAttribute.child(0)?.get('label'),
                            type:  rawAttribute.child(0)?.get('type')
                        }
                        newAttributes.push(attribute)
                    })

                    //  Query name of the current node
                    const name = this.astq.query(currentNode, `/ Signature`)[0]?.get('label')

                    //  Create shallow data model of the current node
                    this.props = {
                        name,
                        links:      newLinks,
                        attributes: newAttributes,
                        id:         currentNode.get('id'),
                        type:       currentNode.child(0)?.get('type')
                    }
                } 
                else {
                    //  Close prop editor
                    this.currentNode = null
                }
            },

            //  Removes element from AST
            removeElement () {
                this.sml.applyRemove(this.currentNode.get('id'))
            },

            //  Removes attribute from AST
            removeAttribute (id) {
                this.sml.applyRemove(id, this.currentNode)
            },

            //  Removes link from AST
            removeLink (id) {
                this.sml.applyRemove(id, this.currentNode)
            },

            //  Renames atribute in ast
            renameAttribute (payload) {
                this.sml.applyRename(payload.label, payload.id)
            },

            //  Renames link
            renameLink (payload) {
                this.sml.applyRename(payload.label, payload.id)
            },

            //  Changes type of current element
            typeChanged () {
                this.sml.changeType(this.props.id, this.props.type)
            },

            //  Opens link creation dialog
            openLinkConfig () {
                this.dialog = true
            }
        }
    }
</script>

<style scoped lang="scss">
    .prop-container {
        height: 100%;
        &-padded-row {
            padding-left:  12px;
            padding-right: 12px;
        }
        &-card {
            overflow-y: auto;
            overflow-x: hidden;
            width:  100%;
            height: 100%;
        }
    }

    .vertical-center {
        display: flex;
        align-items: center;
    }

    .horizontal-flexBox {
        flex-direction: row;
        display: flex;
        align-items: center;
    }
</style>

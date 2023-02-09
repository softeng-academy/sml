/* eslint-disable no-unused-vars */

import ASTY           from 'asty'
import ASTQ           from 'astq'
import PARSER         from './parser.js'
import FORMATTER      from './formatter.js'
import JOINTJSMANAGER from './jointJsManager.js'
import LAYOUTER       from './layouter.js'

export default class sml {
    constructor (dsl, holder, updateEditor, openLinkConfig, initiatePropEditor, showError, removeLinkPropEditor, settings, darkMode, changeCursorPos) {
        this.dsl                  = dsl
        this.holder               = holder
        this.updateEditor         = updateEditor
        this.openLinkConfig       = openLinkConfig
        this.initiatePropEditor   = initiatePropEditor
        this.showError            = showError
        this.removeLinkPropEditor = removeLinkPropEditor
        this.settings             = settings
        this.darkMode             = darkMode
        this.changeCursorPos      = changeCursorPos

        this.currentLinkView             = null
        this.currentElementViewConnected = null
        this.regenerationStopper         = false
        
        this.asty      = new ASTY()
        this.astq      = new ASTQ()
        this.parser    = new PARSER   (this.asty, this.astq)
        this.formatter = new FORMATTER(this.asty, this.astq)
        this.layouter  = new LAYOUTER(this, this.astq, this.asty)

        let parsing = this.parser.parse(dsl)
        let result  = parsing.result
        this.ast    = parsing.ast
        
        this.jointJsManager = null
        if (holder) {
            this.jointJsManager = new JOINTJSMANAGER(holder, this.astq, this, this.darkMode)
            if (this.ast)
                this._regenerateDSLAndUpdate(this.ast)
        }

        //  Apply layouting
        this.layouter.positionPositionlessElements(this.ast, this.jointJsManager.getPaper(), this.jointJsManager.getGraph())
        
        //  Show errors in case some appeared
        this.showError(result.warnings, result.errors)
    }

    updateDSL (dsl) {
        this.dsl = dsl
        this._generateAST(dsl)
    }

    //  Generates DSL from AST and AST again from DSL
    regenerateDSLOnASTChanges (ast, focusNode) {
        this._regenerateDSLAndUpdate(ast, focusNode)
    }

    //  Generate AST from DSL
    _generateAST (dsl) {
        const output = this.parser.parse(dsl)
        if (output.result.valid) {
            this.ast = output.ast
            this.jointJsManager.generate(this.ast)
            this.initiatePropEditor()
        }
        this.showError(output.result.warnings, output.result.errors)
        this.layouter.positionPositionlessElements(this.ast, this.jointJsManager.getPaper(), this.jointJsManager.getGraph())
    }

    //  Parse DSL from AST
    generateDSL (ast) {
        this.dsl = this.formatter.format(ast, false)
        this.updateEditor(this.dsl)
    }

    //  Used if AST is altered and positions need to be updated
    //  Generates DSL from AST and then reparses the dsl again
    _regenerateDSLAndUpdate (ast, focusNode) {
        const output = this.parser.parse(this.formatter.format(ast, false))
        if (output.result.valid) {
            this.ast = output.ast
            this.jointJsManager.generate(this.ast)
            this.dsl =  this.formatter.format(this.ast, false)
            this.updateEditor(this.dsl)
            this.initiatePropEditor(this.findFocusInAst(focusNode))

            //  If focus node is present, highlight the corresponding box
            if (focusNode) {
                let cellOfNewNode = this.jointJsManager.getGraph().getElements().filter(x => x.attributes.name === focusNode.child(0).get('label'))?.[0]
                cellOfNewNode.findView(this.jointJsManager.getPaper()).highlight()
            }
        }
        else {
            this.dsl = this.formatter.format(this.ast, false)
            this.updateEditor(this.dsl)
        }
        this.layouter.positionPositionlessElements(this.ast, this.jointJsManager.getPaper(), this.jointJsManager.getGraph(), focusNode)
        this.showError(output.result.warnings, output.result.errors)
    }

    //  Format DSL into recommended format
    formatText () {
        //  Get new DSL, update it and generate AST and graph
        const newDSL = this.formatter.formatRecommended(this.ast)
        this.updateDSL(newDSL)
    }

    //  Executed after regenerating the AST to find an old and focused node in the new AST
    findFocusInAst (focus) {
        let node
        let label = focus?.child(0)?.get('label')
        if (label)
            node = this.astq.query(this.ast, `// Element [ / Signature [ @label == {label} ] ]`, {label: label})[0]
        return node ?? undefined
    }

    //  Update propeditor and editor-cursor to the clicked element
    handleClick (cellView, evt, x, y) {
        //  Check if a JointJs element was clicked
        if (cellView) {
            //  If a box was clicked, the associated AST-element is found
            //  If a link was clicked, it's parent element is found and selected
            let clickedNode
            const attrs = cellView.model.attributes
            if (attrs.type === 'sml.Box') {
                //  Highlight clicked element
                this._unhighlightAll()
                cellView.highlight()

                //  Search box in ast
                clickedNode = this.astq.query(this.ast, `// Element [ / Signature [ @label == {label} ] ]`, {label: attrs.name})[0]
                
                // Change position of cursor
                this.changeCursorPos({lineNumber: clickedNode.pos().line, column: clickedNode.pos().column})
            }
            else if (attrs.type.match(/^sml\.(?:Link|Compose|Inherit)$/))
                clickedNode = this.astq.query(this.ast, `// Element [ / Signature [ @label == {label} ] ]`, {label: attrs.sourceName})[0]

            //  If a node was found, the prop editor is initialized
            if (clickedNode)
                this.initiatePropEditor(clickedNode)
        }
    }

    //  Changes name of an element
    applyNameChange (node, newLabel) {
        //  Find old label and signature
        const astSignature = node.child(0)
        const oldLabel = astSignature.get('label')

        //  Find all spec-less signatures, i.e. attributes or links 
        let associations = this.astq.query(this.ast, `// Signature [!+// Spec ]`)

        //  Change their type if it matches the old name of the box (element) to the new one
        associations.forEach(asso => {
            if (asso.get('type') === oldLabel)
                asso.set('type', newLabel)
        })
        
        //  Set new label
        astSignature.set('label', newLabel)

        //  Update DSL and gui
        this._regenerateDSLAndUpdate(this.ast, node)
    }

    //  Removes attributes and links and elements
    applyRemove (id, node) {
        //  Find the element to be deleted
        const elem = this.astq.query(this.ast, `// * [ @id == {id} ]`, {id: id})[0]

        //  Delete element
        if(elem.type() === 'Element')
            elem.P.del(elem)
        else
            elem.P.P.del(elem.P)

        //  Update DSL and prop editor and gui
        this._regenerateDSLAndUpdate(this.ast, node)
    }

    dropNewElem (x, y, elem) {
        this.jointJsManager.dropNewElem(x, y, elem)
    }

    //  Rename an element in the AST
    applyRename (label, id) {
        const targetLink = this.astq.query(this.ast, `// * [ @id == {id} ]`, {id: id})[0]
        const oldLabelLength = targetLink.get('label') ? targetLink.get('label').length : 0
        const dif = label.length - oldLabelLength
        targetLink.set('label', label)
        targetLink.set('length', targetLink.get('length') + dif)
        //this._shiftAllFollowing(dif, targetLink.pos().line, targetLink)
        this.jointJsManager.generate(this.ast)
    }

    //  Change the docks of a link
    changeDocks (id, startDock, targetDock, selectedStartDock, selectedTargetDock, node) {
        //  Get the target tags
        const tag = this.astq.query(this.ast, `// * [ @id == {id} ] / Tag `, {id: id})[0]
        const docks = tag.get('args')

        //  Set the new values
        docks[0] = docks[0].replaceAll(startDock.replaceAll('"', ''), selectedStartDock.replaceAll('"', ''))
        docks[1] = docks[1].replaceAll(targetDock.replaceAll('"', ''), selectedTargetDock.replaceAll('"', ''))
        tag.set('args', docks)

        //  Update GUI
        this.jointJsManager.generate(this.ast)
        this.initiatePropEditor(node)
    }

    //  Change the type of a link
    changeTag (id, tagName) {
        //  Get target tag
        const tag = this.astq.query(this.ast, `// * [ @id == {id} ]`, {id: id})[0]

        //  Set new data
        //tag.set('length', tag.get('length') + dif)
        tag.set('name', tagName)

        //  Update GUI
        //this._shiftAllFollowing(dif, tag.pos().line, tag)
        this.jointJsManager.generate(this.ast)
    }

    //  Change target of link
    changeTarget (id, targetElem) {
        const sig = this.astq.query(this.ast, `// * [ / Tag [ @id == {id} ] ]`, {id: id})[0]
        this._changeSignatureType(sig, targetElem)
    }

    //  Change type of element
    changeType (id, type) {
        //  Find signature in question
        const signature = this.astq.query(this.ast, `// * [ @id == {id} ]`, {id: id})[0].child(0)
        this._changeSignatureType(signature, type)
    }

    //  Change type of attribute
    changeAttributeType (id, type) {
        //  Find signature in question
        const signature = this.astq.query(this.ast, `// * [ @id == {id} ]`, {id: id})[0]
        this._changeSignatureType(signature, type)
    }

    //  Changes signature type of signature
    _changeSignatureType (signature, type) {
        //  Calculate the change of sig.length
        const dif = type.length - signature.get('type').length

        //  Set length and type of signature
        signature.set('length', signature.get('type').length + dif)
        signature.set('type', type)

        //  Shift the AST and update GUI
        //this._shiftAllFollowing(dif, signature.pos().line, signature)
        this.jointJsManager.generate(this.ast)
    }

    //  Add a new element
    addElement (type, x, y) {
        //  Add line break to currently last top level child if it has none
        const lastElem = this.ast.child(this.ast.childs().length - 1)
        const space = lastElem?.get('space3')
        if (space && !space.match(/\n/g))
            lastElem.set('space3', space + '\n')

        //  Determine name of the box
        const newBoxRegex = /NewBox/i
        let num = 0
        this.astq.query(this.ast, `// Signature`).forEach((signature) => {
            if (signature.get('label').match(newBoxRegex))
                num++
        })

        //  Create signature
        const signature = this.asty.create('Signature').set({
            type,
            label: 'NewBox' + num,
            id: crypto.randomUUID(),
            labelSpace1: '',
            labelSpace2: '',
            space1: ' '
        })

        //  Create pos tag
        const tag = this.asty.create('Tag').set({
            name: 'pos', 
            args: [ Math.round(x / 10), Math.round(y / 10) ], 
            id  : crypto.randomUUID() 
        })
        tag.set('space0', ' ')
        
        //  Create spec
        const spec = this.asty.create('Spec').set({ id: crypto.randomUUID() })
        spec.set('space0', '\n')
        spec.set('space1', '')

        //  Add element to ast
        this._addToAst(this.ast, signature, tag, spec)
    }

    //  Handles paste functionality 
    handlePaste (node) {     
        //  Get new box name 
        let allSignaturesLabels = this.astq.query(this.ast, `// Signature [ +// Spec ]`).map(sig => sig.get('label'))
        let checkForCopies = new RegExp(`${node.child(0).get('label')}(Copy)+`, 'g')
        let newName = node.child(0).get('label')
        for (const sig of allSignaturesLabels) {
            if (sig.match(checkForCopies) && sig.length > newName.length)
                newName = sig 
        }

        //  Create and add element
        let newElem = this.createElemForCopyAndPaste(node, newName + 'Copy')
        this.ast.add(newElem)
        this._regenerateDSLAndUpdate(this.ast, node)
    }

    //  Handles cut functionality 
    handleCut (node) {
        //  Removes element from AST and paste it inside again
        this.ast.del(this.findFocusInAst(node))
        let newElem = this.createElemForCopyAndPaste(node, node.child(0).get('label'))
        this.ast.add(newElem)
        this._regenerateDSLAndUpdate(this.ast)
    }

    //  Moves a box with the given x and y movement
    moveBox (node, xMovement, yMovement) {
        //  Make update in AST and push new DSL to editor
        let nodeAst = this.findFocusInAst(node)
        let posTag = nodeAst.child(0).child(0)
        if (!posTag) {
            const newPosTag = this.asty.create('Tag').set({ name: 'pos', args: [ xMovement * 10, yMovement * 10 ], id: crypto.randomUUID() })
            nodeAst.child(0).add(newPosTag)
        }
        else {
            let args = posTag.get('args')
            posTag.set('args', [Number(args[0]) + xMovement, Number(args[1]) + yMovement])
        }
        this.generateDSL(this.ast)

        //  Move box accordingly
        let cellOfNewNode = this.jointJsManager.getGraph().getElements().filter(x => x.attributes.name === node.child(0).get('label'))?.[0]
        cellOfNewNode.position(cellOfNewNode.position().x + (xMovement * 10), cellOfNewNode.position().y + (yMovement * 10), { deep: true })
        cellOfNewNode.findView(this.jointJsManager.getPaper()).highlight()
    }

    //  Creates a new element based on the copied data an prepares it to be added again
    createElemForCopyAndPaste (node, label) {
        let lastChild = this.ast.child(this.ast.C.length - 1)
        let newElem = this.asty.create('Element').set({ id: crypto.randomUUID(), space0: lastChild.get('space3').includes('\n') ? '' : '\n' })
        let newSig = this.asty.create('Signature').set({ 
            type:  node.child(0).get('type'),
            label: label,
            labelSpace1: node.child(0).get('labelSpace1'),
            labelSpace2: node.child(0).get('labelSpace2'),
            id: crypto.randomUUID(),
            lines: 1 
        })
        newElem.add([newSig, node.child(1)])
        return newElem
    }

    //  Adds pos tag to AST elements, which represents their position on the paper
    addPositionTag (box, x, y, orig) {
        //  Find every Element with a spec
        this.astq.query(this.ast, '// Element [ / Spec ]').forEach((node, index) => {
            //  If the elements id attribute corresponds to a box-technical id, it represents an element and not an attribute
            if (node.get('id') === box.attributes.technicalId) {
                //  Only proceed if the new coordinates are 0 or higher
                if (Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0) {
                    //  Find current posTag
                    const posTag = this.astq.query(node, '/ Signature / Tag [ @name == "pos" ]')[0]

                    //  If a posTag already exists, modify it
                    if (posTag) {
                        const [ curX, curY ] = posTag.get('args')
                        if (x === 0 && y === 0)
                            node.child(0)?.del(posTag)
                        else if (curX !== x / 10 || curY !== y / 10)
                            posTag.set('args', [ x / 10, y / 10 ])
                    }
                    else {
                        if (x > 0 && y > 0) {
                            //  Create new posTag
                            const newPosTag = this.asty.create('Tag').set({ name: 'pos', args: [ x / 10, y / 10 ], id: crypto.randomUUID() })
                            if (node.child(0).get('space4').length === 0)                            
                                newPosTag.set('space0', ' ')
                            node.child(0).add(newPosTag)
                        }
                    }

                    //  If not first render, generate DSL from AST
                    if (!orig)
                        this.generateDSL(this.ast)
                }
            }
        })
    }

    // DEPRECATED
    /*
    // Recalculates the length of all elements after one was added or modified
    _shiftAllFollowing (shift, line, node, lineShift = 0) {
        //  Add the new length to all parents of the node
        this.astq.query(node, `..// *`).forEach((node) => {
            node.set('length', node.get('length') + shift)
        })
        
        //  Shift the positions of all following elements if they are in the same line
        let shiftEnabled = false
        this.ast.walk((walky) => {
            //  Add the shift to position and offset if the element comes after the modified element and in the same line
            //  Else: Add the lineshift to the element if it comes after the modified element but is not in the same line
            if (walky.pos().line === line && shiftEnabled)
                walky.pos(walky.pos().line, walky.pos().column + shift, walky.pos().offset + shift)
            else if (shiftEnabled)
                walky.pos(walky.pos().line + lineShift, walky.pos().column, walky.pos().offset)

            // Set shiftEnabled to true after reaching the modified element
            if (walky.get('id') === node.get('id'))
                shiftEnabled = true
        })

        //  Set size of global spec
        this.ast.set({ length: this.ast.C.reduce((a, b) => a + b.get('length') , 0) })
    }
    */

    //  Removes position tag from AST node associated to JointJs box
    removePositionTag (box) {
        this.astq.query(this.ast, '// Element [ / Spec ]').forEach((node) => {
            if (node.child(0).get('label') === box.attributes.name) {
                const posTag = this.astq.query(node, '/ Signature / Tag [ @name == "pos" ]')[0]
                if (posTag)
                    node.child(0).del(posTag)
            }
        })
    }

    //  Saves the start and target of new link that was created with GUI and opens a link config dialog
    handleConnect = (link, evt, element, magnet) => {
        this.currentLinkView = link
        this.currentElementViewConnected = element
        this.openLinkConfig()
    }

    //  Adds a new attribute to a node
    addAttrFromPropEditor = (node, attr) => {
        const signature = this.asty.create('Signature').set({
            type:  attr.type,
            label: attr.label,
            labelSpace1: '',
            labelSpace2: '',
            id: crypto.randomUUID(),
            lines: 1 
        })
        this._addToAst(node, signature)
    }

    //  Adds link to node
    addLinkFromPropEditor = (node, link) => {
        //  Create dock node
        const dock = this.asty.create('Tag').set({
            name: 'dock',
            args: [ '"lm"', '"rm"' ], 
            id: crypto.randomUUID(), 
            space0: ' ' 
        })

        //  Create signature node
        const signature = this.asty.create('Signature').set({ 
            type:       link.targetElem, 
            label:      link.label, 
            space4:     link.cardinality.match(/^(?:\*|\?|\+)$/) || link.cardinality.trim() === '' ? '' : ' ', 
            constraint: link.cardinality, 
            id: crypto.randomUUID() 
        })
        
        //  Create new element from signature and dock and add to AST
        this._addToAst(node, signature, dock)
    }

    //  Adds a node to AST
    _addToAst = (node, signature, dock, childSpec) => {
        //  Variable declaration
        let precedingElem, precElemPos, spaceInQuestion, spec, lines = 0

        //  Preceeding node evaluation
        //  Find space that needs to be checked for spaces, either of spec (space0) or last sibling element (space1)
        //  Box is being added
        if (node.T === 'Spec') {
            spec = node
            const elems = this.astq.query(node, '/ Element')
            precedingElem = elems[elems.length - 1]
            spaceInQuestion = 'space3'

            //  Check for linebreaks in preceeding node
            if (precedingElem && !precedingElem.A[spaceInQuestion].includes('\n\n'))
                precedingElem.set(spaceInQuestion, '\n\n')
        }

        //  Attribute is being added
        if (node.T === 'Element') {
            spec = node.child(1)
            const attElems = this.astq.query(node, '/ Spec / Element')
            if (attElems.length === 0) {
                precedingElem = spec
                spaceInQuestion = 'space0'
            }
            else {
                precedingElem = attElems[attElems.length - 1]
                spaceInQuestion = 'space3'
            }

            //  Check for linebreaks in preceeding node
            precedingElem.set(spaceInQuestion, '\n')
            
        }

        //  Element creation
        //  Get parents to determine amount of required spaces
        const numOfParents = this.astq.query(node, '..// * [ /Element ]').length
        let spaces = ''
        for (let i = 0; i < numOfParents * 4; i++)
            spaces += ' '

        //  Create element, position and add it and shift all following lines
        const elem = this.asty.create('Element').set({ id: crypto.randomUUID(), 
            space0: spaces, space1: '', space2: '', space3: '\n' })
        spec.add(elem)

        //  Position and add signature and dock
        elem.add(signature)
        if (dock) {
            signature.add(dock)
        }
        if (childSpec) {
            elem.add(childSpec)
        }

        //  Apply changes
        this._regenerateDSLAndUpdate(this.ast, node.T === 'Spec' ? elem : node )
    }

    //  Finds linebreaks in node
    findLinebreaks = (node) => {
        let linebreaks = 0
        node.walk((walky) => {
            linebreaks +=   (walky.get('space0') ? (walky.get('space0').match(/\n/g) || []).length : 0) +
                            (walky.get('space1') ? (walky.get('space1').match(/\n/g) || []).length : 0) +
                            (walky.get('space2') ? (walky.get('space2').match(/\n/g) || []).length : 0) +
                            (walky.get('space3') ? (walky.get('space3').match(/\n/g) || []).length : 0)
        })
        return linebreaks
    }

    //  Adds a link node to AST
    addLinkWithConfig = (label, constraint) => {
        //  Get graph, start- and target dock from the jointJs link attribute
        const graph = this.jointJsManager.getGraph()
        const sourceDock = this.currentLinkView.sourceMagnet.getAttribute('joint-selector').substring(0, 2)
        const targetDock = this.currentLinkView.targetMagnet.getAttribute('joint-selector').substring(0, 2)
        const type = this.currentElementViewConnected.model.attributes.name

        //  Define dock element
        const dock = this.asty.create('Tag').set({ name: 'dock', args: [ `"${sourceDock}"`, `"${targetDock}"` ], id: crypto.randomUUID() })
        dock.set({ space0: ' ', space1: '', space2: '', space3: '' })

        //  Define signature element
        const signature = this.asty.create('Signature').set({ 
            type, 
            label, 
            constraint,
            space2: ' ', 
            space4: constraint.match(/^(?:\*|\?|\+)$/) || constraint.trim() === '' ? '' : ' ',
            id: crypto.randomUUID() 
        })

        //  Get jointjs model of source of link
        let sourceElem
        for (const elem of graph.getElements())
            if (elem.id === this.currentLinkView.model.attributes.source.id)
                sourceElem = elem

        //  Find the AST element that the link will be added to
        this.astq.query(this.ast, `// Element [ / Spec ] `).forEach((node) => {
            if (sourceElem.attributes.name === node.child(0).get('label'))
                this._addToAst(node, signature, dock)
        })

        //  Reset 
        this.resetLinks()
    }

    //  Prepares rerendering
    prepareRerender () {
        this.jointJsManager?.prepareRerender()
    }

    //  Prepares jointjs for export
    prepareExport () {
        this._unhighlightAll()
        this.jointJsManager.getPaper().setGridSize(0)
        this.scaleContentToFit()
        this.jointJsManager.getPaper().fitToContent({ padding: 20, allowNewOrigin: 'positive',})
    }
    
    //  Removes preperations done for the export
    unprepareExport () {
        this.jointJsManager.getPaper().setGridSize(10)
        this.jointJsManager.getPaper().setDimensions('100%', '100%')
    }

    scaleContentToFit () {
        this.jointJsManager.getPaper().scaleContentToFit({ padding: 50 })
    }

    //  Remove saved jointJs link view etc.
    abortAddingLink = () => {
        this.currentLinkView.remove()
        this.resetLinks()
    }

    //  Resets link information
    resetLinks () {
        this.currentElementViewConnected = undefined
        this.currentLinkView = undefined
    }

    _unhighlightAll() {
        //  Unhighlight everything
        const graph = this.jointJsManager.getGraph()
        const paper = this.jointJsManager.getPaper()
        graph.getElements().forEach(elem => {
            paper.findViewByModel(elem).unhighlight()
        })
    }

    //  Restructures AST to reflect embedding in of elements in GUI
    handleEmbed (plannedParentCell, cell, evt, x, y) {
        this._unhighlightAll()

        //  get parent and remove cell from it
        const cellViewParent = cell.getParentCell()
        if (cell.getParentCell()) {
            this.astq.query(
                this.ast,
                `// Element [ / Spec && / Signature [ @label == {label} ] ] `, 
                { label: cellViewParent.attributes.name }
            ).forEach((node) => {
                node.child(1).del(cell.attributes.ast)
                node.child(1).set('space0', '\n')
                if (!node.child(1).child(node.child(1).C.length - 1)?.get('space3').includes('\n'))
                    node.child(1).set('space1', '\n' + node.child(1).get('space1'))
                else
                    node.child(1).set('space1', '')
            })
        }
        else
            this.ast.del(cell.attributes.ast)

        //  check if embedded directly into the graph
        if (!plannedParentCell) {
            // Remove possible indentation of moved element
            this._handleEmbedSpacing(cell.attributes.ast, 0)
            this.ast.add(cell.attributes.ast)
            this._regenerateDSLAndUpdate(this.ast)
        }
        else {
            //  cell is embedded into another cell
            this.astq.query(this.ast, '// Element [ / Spec ]').forEach((node, index) => {
                if (plannedParentCell.attributes.name === node.child(0).get('label')) {
                    //  Adapt element indentation to parent
                    this._handleEmbedSpacing(cell.attributes.ast, this.astq.query(node, '..// * [ /Element ]').length)
                    
                    //  Add element to spec
                    const spec = node.child(1)
                    spec.set('space0', '\n')
                    if (!spec.get('space1').includes('\n') && !cell.attributes.ast.get('space3').includes('\n'))
                        spec.set('space1', '\n')
                    spec.add(cell.attributes.ast)
                }
            })
            this._regenerateDSLAndUpdate(this.ast)
        }
    }

    _handleEmbedSpacing (child, indentation) {
        //  Get current indentation string
        let tabs = ''
        for (let i = 0; i < indentation; i++)
            tabs += '    '

        //  Set spacing
        child.set('space0', '' + tabs)
        child.child(1)?.set('space0', '\n')
        if (!child.child(1)?.child(child.child(1).C.length - 1)?.get('space3')?.includes('\n'))
            child.child(1)?.set('space1', '\n' + tabs)
        else 
            child.child(1)?.set('space1', tabs)
        //  Adapt spacing for children in node
        if (child.C.length === 2)
            for (let childChild of child.child(1).C)
                this._handleEmbedSpacing(childChild, indentation + 1)
    }

    //  Returns correct indentation depending on ancestors
    getSpacing (tabsCounter) {
        if (this.settings.lineBreaking) {
            let tabs = ''
            for (let i = 0; i < tabsCounter; i++)
                tabs += '    '
            return '\n' + tabs
        }
        else
            return ' '
    }

    getAst () {
        return this.ast
    }

    getAstQ () {
        return this.astq
    }
}

import { images } from '../../resources/images/boxTypes'
export default class JointJsGenerator {
    constructor (config, joint, graph, astq, sml, linkRouter, darkMode) {
        this.associations    = []
        this.headerOffset    = config.headerOffset
        this.attributeOffset = config.attributeOffset
        this.boxStdSize      = config.boxStdSize
        this.joint           = joint
        this.graph           = graph
        this.astq            = astq
        this.sml             = sml
        this.linkRouter      = linkRouter
        this.darkMode        = darkMode
        this.iconURLs        = { dark: null, light: null }
        this.portEnum        = [ 'lt', 'lm', 'lb', 'bl', 'bm', 'br', 'rb', 'rm', 'rt', 'tr', 'tm', 'tl' ]
        this.iconURLs.light  = {
            entity:      `<svg width="800" height="800" xmlns="http://www.w3.org/2000/svg"> <g>  <title>Layer 1</title>  <rect stroke="#FFFFFF" id="svg_1" height="500" width="400" y="150" x="200" fill="none" stroke-width="30"/>  <line id="svg_3" y2="266" x2="550" y1="266" x1="250" stroke="#FFFFFF" fill="none" stroke-width="30"/>  <line id="svg_4" y2="400" x2="550" y1="400" x1="250" stroke="#FFFFFF" fill="none" stroke-width="30"/>  <line id="svg_5" y2="533" x2="550" y1="533" x1="250" stroke="#FFFFFF" fill="none" stroke-width="30"/> </g></svg>`,
            state:       `<svg width="600" height="600" xmlns="http://www.w3.org/2000/svg"> <g>  <title>Layer 1</title>  <circle r="50" cx="100" cy="100" stroke="#FFFFFF" fill="#FFFFFF"/> <circle r="50" cx="500" cy="300" stroke="#FFFFFF" fill="#FFFFFF"/>    <circle r="50" cx="100" cy="500" stroke="#FFFFFF" fill="#FFFFFF"/>        <line id="svg_3" x2="500" y2="300" x1="100" y1="100" stroke="#FFFFFF" fill="none" stroke-width="30"/>    <line id="svg_3" x2="500" y2="300" x1="100" y1="500" stroke="#FFFFFF" fill="none" stroke-width="30"/></g></svg>`,
            layer:       `<svg width="600" height="600" xmlns="http://www.w3.org/2000/svg"> <g>  <title>Layer 1</title>  <line id="svg_3" y2="150" x2="0" y1="150" x1="600" stroke="#FFFFFF" fill="none" stroke-width="30"/>  <line id="svg_4" y2="300" x2="0" y1="300" x1="600" stroke="#FFFFFF" fill="none" stroke-width="30"/>  <line id="svg_5" y2="450" x2="0" y1="450" x1="600" stroke="#FFFFFF" fill="none" stroke-width="30"/> </g></svg>`,
            slice:       `<svg width="600" height="600" xmlns="http://www.w3.org/2000/svg"> <g>  <title>Layer 1</title>  <line id="svg_3" x2="150" y2="0" x1="150" y1="600" stroke="#FFFFFF" fill="none" stroke-width="30"/>  <line id="svg_4" x2="300" y2="0" x1="300" y1="600" stroke="#FFFFFF" fill="none" stroke-width="30"/>  <line id="svg_5" x2="450" y2="0" x1="450" y1="600" stroke="#FFFFFF" fill="none" stroke-width="30"/> </g></svg>`,
            type:        `<svg width="600" height="600" xmlns="http://www.w3.org/2000/svg"> <g>  <title>Layer 1</title>  <circle r="100" cx="300" cy="300" stroke="#FFFFFF" fill="#FFFFFF"/> </g></svg>`,
            enumeration: `<svg width="600" height="600" xmlns="http://www.w3.org/2000/svg"> <g>  <title>Layer 1</title>  <circle r="50" cx="100" cy="300" stroke="#FFFFFF" fill="#FFFFFF"/>  <circle r="50" cx="300" cy="300" stroke="#FFFFFF" fill="#FFFFFF"/>    <circle r="50" cx="500" cy="300" stroke="#FFFFFF" fill="#FFFFFF"/> </g></svg>`
        }
        this.iconURLs.dark   = {
            entity:      `<svg width="800" height="800" xmlns="http://www.w3.org/2000/svg"> <g>  <title>Layer 1</title>  <rect stroke="#000" id="svg_1" height="500" width="400" y="150" x="200" fill="none" stroke-width="30"/>  <line id="svg_3" y2="266" x2="550" y1="266" x1="250" stroke="#000" fill="none" stroke-width="30"/>  <line id="svg_4" y2="400" x2="550" y1="400" x1="250" stroke="#000" fill="none" stroke-width="30"/>  <line id="svg_5" y2="533" x2="550" y1="533" x1="250" stroke="#000" fill="none" stroke-width="30"/> </g></svg>`,
            state:       `<svg width="600" height="600" xmlns="http://www.w3.org/2000/svg"> <g>  <title>Layer 1</title>  <circle r="50" cx="100" cy="100" stroke="#000"/> <circle r="50" cx="500" cy="300" stroke="#000"/>    <circle r="50" cx="100" cy="500" stroke="#000"/>        <line id="svg_3" x2="500" y2="300" x1="100" y1="100" stroke="#000000" fill="none" stroke-width="30"/>    <line id="svg_3" x2="500" y2="300" x1="100" y1="500" stroke="#000000" fill="none" stroke-width="30"/></g></svg>`,
            layer:       `<svg width="600" height="600" xmlns="http://www.w3.org/2000/svg"> <g>  <title>Layer 1</title>  <line id="svg_3" y2="150" x2="0" y1="150" x1="600" stroke="#000" fill="none" stroke-width="30"/>  <line id="svg_4" y2="300" x2="0" y1="300" x1="600" stroke="#000" fill="none" stroke-width="30"/>  <line id="svg_5" y2="450" x2="0" y1="450" x1="600" stroke="#000" fill="none" stroke-width="30"/> </g></svg>`,
            slice:       `<svg width="600" height="600" xmlns="http://www.w3.org/2000/svg"> <g>  <title>Layer 1</title>  <line id="svg_3" x2="150" y2="0" x1="150" y1="600" stroke="#000" fill="none" stroke-width="30"/>  <line id="svg_4" x2="300" y2="0" x1="300" y1="600" stroke="#000" fill="none" stroke-width="30"/>  <line id="svg_5" x2="450" y2="0" x1="450" y1="600" stroke="#000" fill="none" stroke-width="30"/> </g></svg>`,
            type:        `<svg width="600" height="600" xmlns="http://www.w3.org/2000/svg"> <g>  <title>Layer 1</title>  <circle r="100" cx="300" cy="300" stroke="#000"/> </g></svg>`,
            enumeration: `<svg width="600" height="600" xmlns="http://www.w3.org/2000/svg"> <g>  <title>Layer 1</title>  <circle r="50" cx="100" cy="300" stroke="#000"/>  <circle r="50" cx="300" cy="300" stroke="#000"/>    <circle r="50" cx="500" cy="300" stroke="#000"/> </g></svg>`
        }
    }

    _calculateParentSize = (children, parentX, parentY) => {
        let xPos = 0, yPos = 0
        children.forEach((child) => {
            if (child.attributes.type == 'sml.Box') {
                const childXPos = child.position().x - parentX + child.size().width
                const childYPos = child.position().y - parentY + child.size().height
                if (childXPos > xPos)
                    xPos = childXPos
                if (childYPos > yPos)
                    yPos = childYPos
            }
        })
        return { xPos, yPos }
    }

    generate = (ast) => {
        //  Init variables
        this.associations = []
        this.boxNames = []

        //  Clear graph and generate new
        this.graph.clear()
        this.astq.query(ast, `// Element [ / Spec ]`).forEach((element) => {
            this.boxNames.push(element.child(0).get('label'))
        })
        let startXIndex = 50
        this.astq.query(ast, `/ Element [ / Spec ] `).forEach((node) => {
            const data = this._recGenerate(node, 1, 0, startXIndex, 0)
            //  Currently disabled until formatter is implemented
            // startXIndex += data.box.size().width + 100
            this.sml.addPositionTag(data.box, data.box.position().x, data.box.position().y, true)
            data.box.prop('ast', node)
            data.box.toFront({ deep: true })
        })
        this.associations.forEach((asso) => {
            this._addLinks(asso.source, asso.sourcePort, asso.target, asso.targetPort, asso.name, asso.cardinality, asso.type)
        })

        //  Adds icons to the boxes
        this._addBoxIcons()

        return ast
    }

    //  Loops through every icon type, searches for boxes with that type and injects the svg into the icon selector
    _addBoxIcons() {
        let types = ['entity', 'enumeration', 'layer', 'slice', 'state', 'type']
        for (const type of types) {
            let elements = document.querySelectorAll(`[joint-selector="iconImage"][type="${type}"]`)
            let mode = this.darkMode ? 'light' : 'dark'
            for (const elem of elements) {
                elem.innerHTML = images[mode][type]
            }
        }
    }

    _recGenerate = (ast, index, numOfAttrs, parentX, parentY) => {
        //  Determine position of box
        let posX = parentX + 10
        let posY = parentY + 60 + numOfAttrs * 20
        const tags = this.astq.query(ast, `/ Signature / Tag [ @name == "pos" ]`)
        if (tags.length !== 0) {
            const x = Number.parseInt(tags[0].get('args')[0] * 10)
            const y = Number.parseInt(tags[0].get('args')[1] * 10)
            posX = index === 1 ? x : posX + x
            posY = index === 1 ? y : posY + y
        }
        
        //  Generate box
        const box = this._generateBox(
            ast.get('id'),
            ast.child(0).get('label'),
            ':' + ast.child(0).get('type'),
            posX,
            posY
        )
        box.prop('ast', ast)

        //  Declaration of containers
        const children = []
        const attributes = []

        //  Add attributes
        this.astq.query(ast, `/ Spec / Element [ ! */ Spec ]`).forEach((node) => {
            //  If a box exists with element's type, add a connection
            if (this.boxNames.includes(node.child(0).get('type'))) {
                const tags = node.child(0).C
                if (tags) {
                    //  Try to find the type of the tag
                    let assoTag
                    const dockTag    = tags.find((tag) => tag.get('name') === 'dock')
                    const inheritTag = tags.find((tag) => tag.get('name') === 'inherit')
                    const composeTag = tags.find((tag) => tag.get('name') === 'compose')
                    if      (dockTag)    assoTag = dockTag
                    else if (inheritTag) assoTag = inheritTag
                    else if (composeTag) assoTag = composeTag

                    //   Define default ports
                    let sourcePort = 'lm', targetPort = 'rm'

                    //  Add association to associations container
                    if (assoTag) {
                        if (assoTag.get('args')) {
                            const astSP = assoTag.get('args')[0].replaceAll('"', '')
                            const astTP = assoTag.get('args')[1].replaceAll('"', '')
                            if (this.portEnum.includes(astSP))
                                sourcePort = astSP + 'Port'
                            if (this.portEnum.includes(astTP))
                                targetPort = astTP + 'Port'
                        }
                        this.associations.push({
                            source:      ast.child(0).get('label'),
                            sourcePort:  sourcePort,
                            target:      node.child(0).get('type'),
                            targetPort:  targetPort,
                            type:        assoTag.get('name'),
                            name:        node.child(0).get('label'),
                            cardinality: node.child(0).get('constraint')
                        })
                    }
                    else
                        this.associations.push({
                            source:      ast.child(0).get('label'),
                            sourcePort:  'lm',
                            target:      node.child(0).get('type'),
                            targetPort:  'rm',
                            type:        'generic',
                            name:        node.child(0).get('label'),
                            cardinality: node.child(0).get('constraint')
                        })
                }
            }
            else
                attributes.push(
                    this._positionAttribute(
                        node.child(0).get('label'),
                        ':' + node.child(0).get('type'),
                        node.child(0).C,
                        box,
                        attributes.length
                    )
                )
        })
        this.graph.addCells(attributes)

        //  Determine child boxed and add them to child container
        let deepestChild = 0
        this.astq.query(ast, `/ Spec / Element [ * / Spec ]`).forEach((node) => {
            const data = this._recGenerate(node, index + 1, attributes.length, box.position().x, box.position().y)
            box.embed(data.box)
            if (data.test > deepestChild)
                deepestChild = data.test
            box.toFront({ deep: true })
            this.graph.addCells(data.children)
            children.push(data.box)
        })

        //  Adds current box and its children
        this.graph.addCells(attributes)
        this.graph.addCells(children)
        this.graph.addCells(box)

        //  Position children within parent based on height
        if (children.length > 0) {
            //  Position children
            let childWidthSum = 0
            children.forEach((child) => {
                const posTag = this.astq.query(child.attributes.ast, `/ Signature / Tag [ @name == "pos" ]`)[0]
                //  Only reposition if no position is given by DSL
                if (!posTag) {
                    child.position(child.position().x + childWidthSum, child.position().y, { deep: true })
                    const x = child.position().x - (box.position().x + 10)
                    const y = child.position().y - (box.position().y + 60 + attributes.length * 20)
                    if (x > 0 || y > 0)
                        this.sml.addPositionTag(child, x, y)
                    childWidthSum += child.size().width + 10
                }
            })

            //  Does not require attributes, since they are considered when placing the child boxes
            const parentSize = this._calculateParentSize(children, box.position().x, box.position().y)
            if (parentSize.xPos && parentSize.yPos) 
                box.resize(parentSize.xPos + 10, parentSize.yPos + 10)
            return { box, children, attributes, test: deepestChild, height: box.attributes.size.height }
        }
        else {
            //  Increase box size incase attributes extend standard size
            const requiredIncrease = attributes.length * 20 + 60 - this.boxStdSize // 60 === header offset
            if (requiredIncrease > 0)
                box.resize(this.boxStdSize, this.boxStdSize + requiredIncrease)
            return { box, children, attributes, test: index, height: box.attributes.size.height }
        }
    }

    //  Generates sml box, based on passed attributes
    _generateBox = (id, name, type, x, y) => {
        //  Initialize box
        const box = new this.joint.shapes.sml.Box({
            position: { x, y }
        })

        //  Set box content
        box.attr('boxName/textWrap/text', name)
        box.attr('boxType/textWrap/text', type)
        box.attr('iconImage/type', type.substring(1) )

        //  Set box props and resize to the default size
        box.prop('name', name)
        box.prop('technicalId', id)
        box.resize(this.boxStdSize, this.boxStdSize)
        return box
    }

    //  Positions attributes based on the passed attributes
    _positionAttribute = (name, type, tags, box, index) => {
        //  Position and size attribute
        const parentPosition = box.attributes.position
        const parentSize = box.attributes.size
        const position = {
            x: parentPosition.x,
            y: parentPosition.y + (this.headerOffset + this.attributeOffset * index) * parentSize.height
        }
        const attribute = new this.joint.shapes.sml.Attribute({ position })
        attribute.resize(200, 20)

        //  Set attributes content, embed it and return attribute
        tags.forEach((tag) => {
            type += ` @${tag.get('name')}(${tag.get('args').join(', ')})`
        })
        attribute.attr('attributeName/textWrap/text', name)
        attribute.attr('attributeType/textWrap/text', type)
        box.embed(attribute)
        return attribute
    }

    //  Adds links to a box
    _addLinks = (source, sourcePort, target, targetPort, name, cardinality, type) => {
        //  Determine link type
        let link
        switch (type) {
            case 'inherit': link = new this.joint.shapes.sml.Inherit(); break
            case 'compose': link = new this.joint.shapes.sml.Compose(); break
            default:        link = new this.joint.shapes.sml.Link();    break
        }

        //  Configure link 
        link.router(this.linkRouter)
        link.connector('rounded', { radius: 20 })
        const cells = this.graph.getCells()
        let fromCell, toCell
        cells.forEach((cell) => {
            if (cell.attributes.name == source) 
                fromCell = cell
            if (cell.attributes.name == target) 
                toCell = cell
        })
        link.prop('sourceName', source)
        link.prop('targetName', target)
        link.source(fromCell, { selector: sourcePort })
        link.target(toCell, { selector: targetPort })
        if (name !== 'null')
            link.appendLabel({
                markup: [
                    { tagName: 'text', selector: 'text' }, 
                    { tagName: 'rect', selector: 'body' }
                ],
                attrs: {
                    text: { text: name, fill: this.darkMode ? '#FFFFFF' : '#000000' },
                    body: { fill: this.darkMode ? '#FFFFFF' : '#000000' }
                },
                position: { distance: 0.5 }
            })
        if (cardinality !== 'null')
            link.appendLabel({
                markup: [
                    { tagName: 'text', selector: 'text' }, 
                    { tagName: 'rect', selector: 'body' }
                ],
                attrs: {
                    text: { text: cardinality, fill: this.darkMode ? '#FFFFFF' : '#000000' },
                    body: { fill: this.darkMode ? '#FFFFFF' : '#000000' }
                },
                position: { distance: -20, offset: 10 }
            })

        //  Make link visible and return
        this.graph.addCells(link)
        return link
    }

    //  Helper function that returns which of the two boxes is bigger
    _getBiggerBox = (box1, box2) => {
        //  Check for null
        if (!box2) 
            return { biggestBox: box1, changed: false } 
        if (!box1) 
            return { biggestBox: box2, changed: false }

        //  Calculate box size 
        const area1 = box1.width * box1.height
        const area2 = box2.width * box2.height
        if (area1 > area2)
            return { biggestBox: box1, changed: false }
        else
            return { biggestBox: box2, changed: true }
    }
}
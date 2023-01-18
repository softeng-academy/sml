export default class JointJsEventHandler {
    constructor (paper, graph, sml, blackMode) {
        this.paper         = paper
        this.graph         = graph
        this.sml           = sml
        this.blackMode     = blackMode
        this.panning       = false
        this.startingX     = null
        this.startingY     = null
        this.translated    = false
        this.timerRunning  = false
        this.ctrlDown      = false
        this.nestingActive = false
    }

    //  Implementation of paper management functionalities
    //  including zooming and panning
    addEventHandlers = () => {
        //  Zooming
        this.paper.on('blank:mousewheel', this._handleCanvasMouseWheel)
        this.paper.on('cell:mousewheel',  this._handleCellMouseWheel)

        //  Panning
        this.paper.on('blank:pointerdown', (cellView, x, y) => {
            //  Start panning and set dragging starting points
            this.panning   = true
            this.startingX = x
            this.startingY = y
        })
        this.paper.on('blank:pointermove', (cellView, x, y) => {
            //  If the user is currently dragging the paper
            if (this.panning) {
                const diffX = this.startingX - x
                const diffY = this.startingY - y
                if ((diffX !== 0 || diffY !== 0) && !this.translated) {
                    const xTranslate = this.paper.translate().tx - diffX * 1.5 // * 1.5 to reduce scrolling speed
                    const yTranslate = this.paper.translate().ty - diffY * 1.5 // * 1.5 to reduce scrolling speed
                    if (xTranslate <= 0 && yTranslate <= 0) {
                        this.paper.translate(xTranslate, yTranslate)
                        this.translated = true
                    }
                }
                else 
                    this.translated = false

                //  Set new starting x and y
                this.startingX = x
                this.startingY = y
            }
        })
        this.paper.on('blank:pointerup', () => {
            // Stop panning and reset dragging starting points
            this.panning = false
            this.startingX = null
            this.startingY = null
        })

        // Handlers to show and hide ports
        this.paper.on('cell:mouseenter', (elem) => {
            const elemType = elem.model.attributes.type
            if (elemType === 'sml.Box' || elemType === 'sml.Attribute') {
                if (elemType === 'sml.Box')
                    elem = elem.model
                else if (elemType === 'sml.Attribute')
                    elem = elem.model.getAncestors()[0]
                if (elem)
                    this._setPortVisibility(elem, 'visible')
            }
        })
        this.paper.on('cell:mouseleave', (elem) => {
            const elemType = elem.model.attributes.type
            if (elemType === 'sml.Box' || elemType === 'sml.Attribute') {
                if (elemType === 'sml.Box')
                    elem = elem.model
                else if (elemType === 'sml.Attribute')
                    elem = elem.model.getAncestors()[0]
                if (elem)
                    this._setPortVisibility(elem, 'hidden')
            }
        })

        // Handlers for the creation and connection of links
        this.paper.on('link:pointerclick', (cellView, evt, x, y) => { this.sml.handleClick(cellView, evt, x, y) })
        this.paper.on('link:connect', this.sml.handleConnect)
        this.paper.on('link:connect', () => { this._hideAllPorts() })

        //  Handlers for click events on cells
        this.paper.on('cell:pointerdown', (cellView, evt, x, y) => {
            this.sml.handleClick()
            this.currentlyDraggedCell = cellView.model.attributes.type === 'sml.Attribute' ? 
                cellView.model.getAncestors()[0] : cellView.model
            if (this.nestingActive) {
                const elements = document.querySelectorAll('.joint-element')
                for (let i = 0; i < elements.length; i++)
                    elements[i].style.cursor = 'grabbing'
            }
            else {
                if (cellView.model.attributes.type === 'sml.Link') {
                    if (cellView.model.attributes.sourceName)
                        this.sml.handleClick(cellView, evt, x, y)
                }
                else
                    this.sml.handleClick(cellView, evt, x, y)
            }
        })
        this.paper.on('cell:pointerup', (cellView, evt, x, y) => {
            //  Remove link if validateConnection was never called
            if (cellView.model.attributes.type === 'sml.Link') {
                //  Check for validity of link
                if (!cellView.model.attributes.sourceName)
                    cellView.remove() 
                
                //  Hide ports again
                this._hideAllPorts()
            }
            if (this.currentLink) {
                this._hideAllPorts()
                if (!this.isCurLinkValid)
                    this.currentLink.remove()
                this.currentLink = null
                this.isCurLinkValid = false
            }
            else if (this.nestingActive) {
                let cell = cellView.model
                if (cellView.model.attributes.type === 'sml.Attribute')
                    cell = cellView.model.getAncestors()[0]

                //  Remove pos tags if necessary and initiate embedding
                if (this.plannedParentCell)
                    this.sml.removePositionTag(cell)
                else
                    this.sml.addPositionTag(cell, cell.position().x, cell.position().y)
                this.sml.handleEmbed(this.plannedParentCell, cell, evt, x, y)

                //  Reset for next embedding
                this.plannedParentCell = null
            }
            this.currentlyDraggedCell = null
        })

        //  Key event listener to enable and disable nesting        
        window.addEventListener('keydown', this._keyDown)
        window.addEventListener('keyup', this._keyUp)
    }

    //  Prepares rerendering
    prepareRerender () {
        window.removeEventListener('keydown', this._keyDown)
        window.removeEventListener('keyup', this._keyUp)
    }

    _keyDown = (e) => {
        //  Only enable nesting if control is pressed and avoid resetting it while pressing ctrl
        if (e.key === 'Control' && !this.nestingActive) {
            const elements = document.querySelectorAll('.joint-element')
            for (let i = 0; i < elements.length; i++)
                elements[i].style.cursor = 'grab'
            this.nestingActive = true
            this.ctrlDown = true
        }   
    }

    _keyUp = (e) => {
        //  Only disable nesting if control is pressed and user is currently not dragging a cell
        if (e.key === 'Control' && this.nestingActive) {
            if (!this.currentlyDraggedCell) {
                const elements = document.querySelectorAll('.joint-element')
                for (let i = 0; i < elements.length; i++)
                    elements[i].style.cursor = 'move'
                this.nestingActive = false
            }
            this.ctrlDown = false
        }
    }

    _setPortVisibility (elem, visibility) {
        elem.attr({
            tlPort: { visibility },
            blPort: { visibility },
            tmPort: { visibility },
            trPort: { visibility },
            bmPort: { visibility },
            brPort: { visibility },
            ltPort: { visibility },
            lmPort: { visibility },
            lbPort: { visibility },
            rtPort: { visibility },
            rmPort: { visibility },
            rbPort: { visibility }
        })
    }

    //  triggered when zooming over cell
    _handleCellMouseWheel = (cellView, e, x, y, delta) =>
        this._handleCanvasMouseWheel(e, x, y, delta)

    //  triggered when zooming over canvas
    _handleCanvasMouseWheel = (e, x, y, delta) => {
        e.preventDefault()
        const oldScale = this.paper.scale().sx
        const newScale = oldScale + delta * 0.1
        this._scaleToPoint(newScale, x, y)
    };

    //  Scales paper to the point of the users position and zooms to it, depending on the scale
    _scaleToPoint = (nextScale, x, y) => {
        if (nextScale >= 0.1 && nextScale <= 10) {
            //  Get position of zooming
            const currentScale = this.paper.scale().sx
            const beta = currentScale / nextScale
            const ax = x - x * beta
            const ay = y - y * beta

            //  Calculate transition
            const translate = this.paper.translate()
            const nextTx = translate.tx - (ax * nextScale) / 2
            const nextTy = translate.ty - (ay * nextScale) / 2

            //  Apply translation 
            const ctm = this.paper.matrix()
            ctm.a = nextScale
            ctm.d = nextScale
            this.paper.matrix(ctm)
            this.paper.translate(nextTx <= 0 ? nextTx : 0, nextTy <= 0 ? nextTy : 0)
        }
    }

    //  Find the most right and furthest down position
    _calculateParentSize = (children, parentX, parentY) => {
        let mostRightChildPos = 0
        let lowestChildPos = 0
        children.forEach(child => {
            if (child.attributes.type === 'sml.Box') {
                const childXPosition = child.position().x - parentX + child.size().width
                const childYPosition = child.position().y - parentY + child.size().height
                if (childXPosition > mostRightChildPos) 
                    mostRightChildPos = childXPosition
                if (childYPosition > lowestChildPos)
                    lowestChildPos = childYPosition
            }
        })
        return { mostRightChildPos, lowestChildPos }
    }

    //  Defines what happens if the position of an element is changed
    addOnChangeListener = () => {
        this.graph.getElements().forEach(elem => {
            elem.on('change:position', (e, position) => {
                if (this.nestingActive) {
                    this.graph.getElements().forEach(elem => {
                        this.paper.findViewByModel(elem).unhighlight()
                    })
                    if (this.currentlyDraggedCell.attributes.name === e.attributes.name) {
                        const possibleParents = this.paper.findViewsInArea(e.getBBox().center())
                        let currentMaxAnc = 0

                        this.plannedParentCell = null

                        possibleParents.forEach((pp) => {
                            //  Ignore itself or children
                            if (pp.model !== e && 
                                !this.currentlyDraggedCell.getEmbeddedCells({ deep: true }).includes(pp.model) && 
                                pp.model.attributes.type !== 'sml.Attribute') {
                                if (currentMaxAnc === 0) 
                                    this.plannedParentCell = pp.model
                                const currentAnc = pp.model.getAncestors().length
                                if (currentAnc > currentMaxAnc) {
                                    currentMaxAnc = currentAnc
                                    this.plannedParentCell = pp.model
                                }
                            }
                        })
                    }
                    if (this.plannedParentCell)
                        this.paper.findViewByModel(this.plannedParentCell).highlight()
                }
                else {
                    //  Handle attributes
                    if (e.attributes.type !== 'sml.Box') {
                        //  Check parent movement and act accordingly
                        const ancX     = e.getAncestors()[0].position().x
                        const prevAncX = e.getAncestors()[0].previous('position').x
                        const ancY     = e.getAncestors()[0].position().y
                        const prevAncY = e.getAncestors()[0].previous('position').y

                        //  Handle x only movement
                        if (prevAncX !== ancX && prevAncY === ancY) {
                            e.set('position', { x: e.position().x, y: e.previous('position').y })
                            return false
                        }

                        //  Handle y only movement
                        if (prevAncX === ancX && prevAncY !== ancY) {
                            e.set('position', { x: e.previous('position').x, y: e.position().y })
                            return false
                        }

                        //  If parent was reset completely, reset child
                        if (e.getAncestors()[0].previous('position').x === ancX && prevAncY === ancY) {
                            e.set('position', { x: e.previous('position').x, y: e.previous('position').y })
                            return false
                        }

                        return
                    }
                    else {
                        //  Handle boxes
                        
                        //  If no parents available, just let it move
                        const parentId = e.get('parent')
                        if (!parentId) {
                            this.sml.addPositionTag(e, position.x, position.y)
                            this.markWrongPositions()
                            return
                        }
                        else {
                            //  If box has parent, get its x and y borders that cannot be crossed,
                            //  reset e position if it hits the borders
                            //  resize parent and further ancestors if dragged to the right or bottom
                            const childTop   = e.position().y
                            const childLeft  = e.position().x
                            const ancs       = e.getAncestors()
                            const firstAnc   = ancs[0]
                            const attributes = firstAnc.getEmbeddedCells().filter((cell) => cell.attributes.type === 'sml.Attribute')
                            const constrX    = firstAnc.position().x + 10
                            const constrY    = firstAnc.position().y + 60 + attributes.length * 20

                            //  Get parent
                            let parent
                            for (const elem of this.graph.getElements())
                                if (elem.id === parentId)
                                    parent = elem

                            //  If parent was reset, then dont move child
                            if (parent.get('resetTop') || parent.get('resetLeft')) {
                                if (parent.get('resetTop') && !parent.get('resetLeft')) {
                                    //  Top reset, only move left
                                    e.set('position', { x: e.position().x, y: e.previous('position').y })
                                    e.set('resetTop', true)
                                    parent.set('resetTop', false)
                                }
                                else if (!parent.get('resetTop') && parent.get('resetLeft')) {
                                    //  Left reset, only move top
                                    e.set('position', { x: e.previous('position').x, y: e.position().y })
                                    e.set('resetLeft', true)
                                    parent.set('resetLeft', false)
                                }
                                else if (parent.get('resetTop') && parent.get('resetLeft')) {
                                    //  Both reset, don't move
                                    e.set('resetTop', true)
                                    e.set('resetLeft', true)
                                    e.set('position', { x: e.previous('position').x, y: e.previous('position').y })
                                    parent.set('resetTop', false)
                                    parent.set('resetLeft', false)
                                }
                            }
                            else {
                                //  Position of parent was not reset
                                if (constrY > childTop) {
                                    //  Check top position
                                    this.sml.addPositionTag(e, childLeft - constrX, 0)
                                    e.set('position', { x: e.position().x, y: e.previous('position').y })
                                    e.set('resetTop', true)
                                }
                                else if (constrX > childLeft) {
                                    //  Check left side
                                    this.sml.addPositionTag(e, 0, childTop - constrY)
                                    e.set('position', { x: e.previous('position').x, y: e.position().y })
                                    e.set('resetLeft', true)
                                }
                                else {
                                    ancs.forEach((ancestor) => {
                                        this.sml.addPositionTag(e, childLeft - constrX, childTop - constrY)
                                        const parentSize = this._calculateParentSize(ancestor.getEmbeddedCells(), 
                                            ancestor.position().x, ancestor.position().y)
                                        if (parentSize.mostRightChildPos && parentSize.lowestChildPos)
                                            ancestor.resize(parentSize.mostRightChildPos + 10, parentSize.lowestChildPos + 10)
                                    })
                                }
                            }
                        }
                    }
                    this.markWrongPositions()
                }
            })
        })
    }

    //  Finds overlapping elements and marks them red
    markWrongPositions = () => {
        if (!this.timerRunning) {
            this.timerRunning = true
            this.parsingTimeout = setTimeout(this._execMarkWrongPositions, 250)
        }
        else {
            clearTimeout(this.parsingTimeout)
            this.parsingTimeout = setTimeout(this._execMarkWrongPositions, 250)
        }
    }

    _execMarkWrongPositions = () => {
        this.graph.getElements().forEach(elem => {
            elem.attr('boxRect/stroke', this.blackMode ? 'white' : 'black')
        })

        this.graph.getElements().forEach(elem => {
            if (elem.attributes.type === 'sml.Box') {
                const intersectingViews = this.paper.findViewsInArea(elem.getBBox())
                intersectingViews.forEach((view) => {
                    if (!elem.getEmbeddedCells({ deep: true }).includes(view.model) && 
                        !elem.getAncestors().includes(view.model) && 
                        !(elem.attributes.technicalId === view.model.attributes.technicalId)) {
                        view.model.attr('boxRect/stroke', 'red')
                        elem.attr('boxRect/stroke', 'red')
                    }
                })
            }
        })
    }

    // Hides all ports of all elements
    _hideAllPorts = () => {
        this.graph.attributes.cells.models.forEach((elem) => {
            if (elem.attributes.attrs)
                elem.attr({
                    tlPort: { visibility: 'hidden' },
                    tmPort: { visibility: 'hidden' },
                    trPort: { visibility: 'hidden' },
                    blPort: { visibility: 'hidden' },
                    bmPort: { visibility: 'hidden' },
                    brPort: { visibility: 'hidden' },
                    ltPort: { visibility: 'hidden' },
                    lmPort: { visibility: 'hidden' },
                    lbPort: { visibility: 'hidden' },
                    rtPort: { visibility: 'hidden' },
                    rmPort: { visibility: 'hidden' },
                    rbPort: { visibility: 'hidden' }
                })
        })
    }
}
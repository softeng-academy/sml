//  Import jointjs and set window for naming space
const joint  =  require('jointjs') // Jointjs only allows require
window.joint =  joint

//  Initialize required sml library components
import CONFIG       from './jointJsComponents/jointJsConfig'
import GENERATOR    from './jointJsComponents/jointJsGenerator'
import EVENTHANDLER from './jointJsComponents/jointJsEventHandler'

export default class JointJsManager {
    constructor (holder, astq, sml, darkMode) {
        //  Temp variables
        this.boxNames = []
        this.associations = []
        this.nestingActive = false
        this.plannedParentCell = null
        this.currentlyDraggedCell = null
        this.currentLink = null
        this.isCurLinkValid = false
        this.darkMode = darkMode

        //  Variable declaration and initialization
        this.astq = astq
        this.sml = sml
        this.graph = new joint.dia.Graph()
        this.config = new CONFIG(joint, darkMode)
        this.config.initElements()
        this.linkRouter = 'metro'
        this.generator = new GENERATOR(this.config.getConfig(), joint, this.graph, astq, sml, this.linkRouter, this.darkMode)

        //  Give standard link custom router and connector
        const smlLink = new joint.shapes.sml.Link()
        smlLink.router(this.linkRouter)
        smlLink.connector('rounded', { radius: 20 })

        //  Initialize paper
        this.paper = new joint.dia.Paper({
            el: holder,
            model: this.graph,
            restrictTranslate: true, //  Restrict elements from leaving the paper
            width: '100%',
            height: '100%',
            gridSize: 10,
            drawGrid: 'fixedDot',
            preventDefaultBlankAction: false,
            defaultLink: smlLink,

            //  Returns true if a connection is valid, causes cellView to be highlighted if valid
            validateConnection: (cellViewS, magnetS, cellViewT, magnetT, end, linkView) => {
                //  Display all ports that are hidden in default state
                this._displayAllPorts()
                this.currentLink = linkView

                //  Get ancestors and children and determine whether connection is valid or not
                const targetAncs = cellViewT.model.getAncestors()
                const targetChildren = cellViewT.model.getEmbeddedCells({ deep: true })
                if (targetAncs.includes(cellViewS.model)) {
                    this.isCurLinkValid = false
                    return false
                } 
                else if (targetChildren.includes(cellViewS.model)) {
                    this.isCurLinkValid = false
                    return false
                } 
                else if (magnetT) {
                    this.isCurLinkValid = true
                    return true
                } 
                else {
                    this.isCurLinkValid = false
                    return false
                }
            },
            
            //  Only allow interaction with boxes
            interactive: (cellView) => {
                return cellView.model.attributes.type === 'sml.Box'
            }
        })

        //  Init and eventHandler and activate its handlers
        this.eventHandler = new EVENTHANDLER(this.paper, this.graph, this.sml, darkMode)
        this.eventHandler.addEventHandlers()
    }

    //  Takes AST and generates its visual representation via the generator
    generate (ast) {
        let astWithPos = this.generator.generate(ast)
        this.eventHandler.markWrongPositions()
        this.eventHandler.addOnChangeListener()
        this.sml.generateDSL(astWithPos)
    }

    //  Determines position of dropped element and adds it to the AST
    dropNewElem (x, y, elem) {
        const clientPoints = this.paper.clientToLocalPoint({ x, y })
        this.sml.addElement(elem, clientPoints.x, clientPoints.y)
    }

    getGraph () {
        return this.graph
    }

    getPaper () {
        return this.paper
    }

    //  Prepares rerendering
    prepareRerender () {
        this.eventHandler.prepareRerender()
    }

    //  Displays all ports of every box, triggered when link is dragged
    _displayAllPorts () {
        this.graph.attributes.cells.models.forEach((elem) => {
            if (elem.attributes.attrs) {
                elem.attr({
                    tlPort: { visibility: 'visible' },
                    tmPort: { visibility: 'visible' },
                    trPort: { visibility: 'visible' },
                    blPort: { visibility: 'visible' },
                    bmPort: { visibility: 'visible' },
                    brPort: { visibility: 'visible' },
                    ltPort: { visibility: 'visible' },
                    lmPort: { visibility: 'visible' },
                    lbPort: { visibility: 'visible' },
                    rtPort: { visibility: 'visible' },
                    rmPort: { visibility: 'visible' },
                    rbPort: { visibility: 'visible' }
                })
            }
        })
    }
}

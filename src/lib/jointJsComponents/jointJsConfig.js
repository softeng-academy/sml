export default class JointJsConfig {
    constructor (joint, darkMode) {
        this.joint           = joint
        this.darkMode        = darkMode
        this.attributeOffset = 0.1
        this.boxStdSize      = 150 // 200

        this.attributeOffsetLeft = 10
        this.attributeOffsetTop  = 10
        this.fontSizeHeader      = 50 // this.boxStdSize * 0.09
        this.fontSizeBody        = 30 // this.boxStdSize * 0.07
    }

    //  Returns config for the generator
    getConfig = () => {
        return {
            headerOffset:        this.headerOffset,
            attributeOffsetTop:  this.attributeOffsetTop,
            attributeOffsetLeft: this.attributeOffsetLeft,
            boxStdSize:          this.boxStdSize,
            fontSizeBody:        this.fontSizeBody,
            fontSizeHeader:      this.fontSizeHeader,
            dividerOffset:       this._dividerOffset(),
        }
    }

    //  Inits jointjs elements to be used when generating
    initElements = () => {
        this._initShapes()
        this._initLinks()
    }

    _dividerOffset = () => {
        return this.fontSizeHeader * 2 + this.attributeOffsetTop * 2
    }

    //  Initializes all shapes used in sml
    _initShapes = () => {
        //  Definition of sml box
        this.joint.dia.Element.define('sml.Box', {
            name: '',
            ast: null,
            attrs: {
                boxRect: {
                    refX:        0,
                    refY:        0,
                    refWidth:    '100%',
                    refHeight:   '100%',
                    strokeWidth: 1,
                    stroke:      this.darkMode ? '#FFFFFF' : '#000000',
                    fill:        this.darkMode ? '#000000' : '#FFFFFF',
                    rx:          '5px'
                },
                divider: {
                    refX:        0,
                    refY:        this.fontSizeHeader * 2 + this.attributeOffsetTop * 2,//50,
                    refWidth:    '100%',
                    height:      0.01,
                    strokeWidth: 1,
                    stroke:      this.darkMode ? '#FFFFFF' : '#000000',
                    fill:        this.darkMode ? '#FFFFFF' : '#000000',
                },
                boxName: {
                    textAnchor: 'left',
                    refX:       this.attributeOffsetLeft,
                    refY:       this.attributeOffsetTop,
                    fill:       this.darkMode ? '#FFFFFF' : '#000000',
                    fontSize:   this.fontSizeHeader,
                    textWrap: {
                        text:     '',
                        width:    '100%',
                        height:   this.fontSizeHeader + 'px',
                        ellipsis: true
                    }
                },
                boxType: {
                    textAnchor: 'left',
                    refX:       this.attributeOffsetLeft,
                    refY:       this.fontSizeHeader + this.attributeOffsetTop,
                    fill:       this.darkMode ? '#FFFFFF' : '#000000',
                    fontSize:   this.fontSizeHeader,
                    textWrap: {
                        text:     '',
                        width:    '80%',
                        height:   this.fontSizeHeader + 'px',
                        ellipsis: true
                    }
                },
                iconImage: {
                    refX:   '100%',
                    refX2:  -40,
                    refY:   10,
                    width:  30,
                    height: 30
                },
                iconBox: {
                    refX:        '100%',
                    refX2:       -40,
                    refY:        10,
                    width:       30,
                    height:      30,
                    strokeWidth: 1,
                    stroke:      this.darkMode ? '#FFFFFF' : '#000000',
                    fill:        this.darkMode ? '#000000' : '#FFFFFF',
                    rx:          '5px'
                },
                lbPort: {
                    refX:        '0%',
                    refY:        '75%',
                    refY2:       -7.5,
                    width:       5,
                    height:      15,
                    magnet:      true,
                    strokeWidth: 1,
                    visibility:  'hidden',
                    stroke:      '#B07F1F',
                    fill:        '#B07F1F'
                },
                lmPort: {
                    refX:        '0%',
                    refY:        '50%',
                    refY2:       -7.5,
                    width:       5,
                    height:      15,
                    magnet:      true,
                    strokeWidth: 1,
                    visibility:  'hidden',
                    stroke:      '#B07F1F',
                    fill:        '#B07F1F'
                },
                ltPort: {
                    refX:        '0%',
                    refY:        '25%',
                    refY2:       -7.5,
                    width:       5,
                    height:      15,
                    magnet:      true,
                    strokeWidth: 1,
                    visibility:  'hidden',
                    stroke:      '#B07F1F',
                    fill:        '#B07F1F'
                },
                rbPort: {
                    refX:        '100%',
                    refX2:       -5,
                    refY:        '75%',
                    refY2:       -7.5,
                    width:       5,
                    height:      15,
                    magnet:      true,
                    strokeWidth: 1,
                    visibility:  'hidden',
                    stroke:      '#B07F1F',
                    fill:        '#B07F1F'
                },
                rmPort: {
                    refX:        '100%',
                    refX2:       -5,
                    refY:        '50%',
                    refY2:       -7.5,
                    width:       5,
                    height:      15,
                    magnet:      true,
                    strokeWidth: 1,
                    visibility:  'hidden',
                    stroke:      '#B07F1F',
                    fill:        '#B07F1F'
                },
                rtPort: {
                    refX:        '100%',
                    refX2:       -5,
                    refY:        '25%',
                    refY2:       -7.5,
                    width:       5,
                    height:      15,
                    magnet:      true,
                    strokeWidth: 1,
                    visibility:  'hidden',
                    stroke:      '#B07F1F',
                    fill:        '#B07F1F'
                },
                tlPort: {
                    refX:        '25%',
                    refX2:       -7.5,
                    refY:        '0%',
                    width:       15,
                    height:      5,
                    magnet:      true,
                    strokeWidth: 1,
                    visibility:  'hidden',
                    stroke:      '#B07F1F',
                    fill:        '#B07F1F'
                },
                tmPort: {
                    refX:        '50%',
                    refX2:       -7.5,
                    refY:        '0%',
                    width:       15,
                    height:      5,
                    magnet:      true,
                    strokeWidth: 1,
                    visibility:  'hidden',
                    stroke:      '#B07F1F',
                    fill:        '#B07F1F'
                },
                trPort: {
                    refX:        '75%',
                    refX2:       -7.5,
                    refY:        '0%',
                    width:       15,
                    height:      5,
                    magnet:      true,
                    strokeWidth: 1,
                    visibility:  'hidden',
                    stroke:      '#B07F1F',
                    fill:        '#B07F1F'
                },
                blPort: {
                    refX:        '25%',
                    refX2:       -7.5,
                    refY:        '100%',
                    refY2:       -5,
                    width:       15,
                    height:      5,
                    magnet:      true,
                    strokeWidth: 1,
                    visibility:  'hidden',
                    stroke:      '#B07F1F',
                    fill:        '#B07F1F'
                },
                bmPort: {
                    refX:        '50%',
                    refX2:       -7.5,
                    refY:        '100%',
                    refY2:       -5,
                    width:       15,
                    height:      5,
                    magnet:      true,
                    strokeWidth: 1,
                    visibility:  'hidden',
                    stroke:      '#B07F1F',
                    fill:        '#B07F1F'
                },
                brPort: {
                    refX:        '75%',
                    refX2:       -7.5,
                    refY:        '100%',
                    refY2:       -5,
                    width:       15,
                    height:      5,
                    magnet:      true,
                    strokeWidth: 1,
                    visibility:  'hidden',
                    stroke:      '#B07F1F',
                    fill:        '#B07F1F'
                }
            },
            markup: [
                { tagName: 'rect',  selector: 'boxRect' },
                { tagName: 'text',  selector: 'boxName' },
                { tagName: 'text',  selector: 'boxType' },
                { tagName: 'rect',  selector: 'iconBox' },
                { tagName: 'g',     selector: 'iconImage'},
                { tagName: 'rect',  selector: 'divider' },
                { tagName: 'rect',  selector: 'lbPort' },
                { tagName: 'rect',  selector: 'lmPort' },
                { tagName: 'rect',  selector: 'ltPort' },
                { tagName: 'rect',  selector: 'rbPort' },
                { tagName: 'rect',  selector: 'rmPort' },
                { tagName: 'rect',  selector: 'rtPort' },
                { tagName: 'rect',  selector: 'tlPort' },
                { tagName: 'rect',  selector: 'tmPort' },
                { tagName: 'rect',  selector: 'trPort' },
                { tagName: 'rect',  selector: 'blPort' },
                { tagName: 'rect',  selector: 'bmPort' },
                { tagName: 'rect',  selector: 'brPort' }
            ]
        })

        // Define sml attributes
        this.joint.dia.Element.define('sml.Attribute', {
            attrs: {
                attributeName: {
                    textAnchor: 'left',
                    refX:       '0%',
                    fill:       this.darkMode ? '#FFFFFF' : '#000000',
                    fontSize:   this.fontSizeBody,
                    text:     '',
                    width:    '48%',
                    //height:   this.fontSizeBody + 'px',
                    ellipsis: true
                },
                attributeType: {
                    textAnchor: 'left',
                    refX:       '50%',
                    fill:       this.darkMode ? '#FFFFFF' : '#000000',
                    fontSize:   this.fontSizeBody,
                    text:     '',
                    width:    '48%',
                    ellipsis: true
                    
                }
            },
            markup: [
                { tagName: 'text', selector: 'attributeName' },
                { tagName: 'text', selector: 'attributeType' }
            ]
        })
    }

    // Defines all used links
    _initLinks = () => {
        // Definition of general link
        this.joint.dia.Link.define('sml.Link', {
            attrs: {
                line: {
                    connection:     true,
                    stroke:         this.darkMode ? '#FFFFFF' : '#000000',
                    strokeWidth:    2,
                    strokeLinejoin: 'round',
                    targetMarker: {
                        type: 'path',
                        d:    'M 10 -5 0 0 10 5 z'
                    }
                },
                wrapper: {
                    connection:     true,
                    strokeWidth:    10,
                    strokeLinejoin: 'round'
                }
            }
        }, 
        {
            markup: [
                {
                    tagName:  'path',
                    selector: 'wrapper',
                    attributes: {
                        fill:   'none',
                        cursor: 'pointer',
                        stroke: 'transparent'
                    }
                }, 
                {
                    tagName:  'path',
                    selector: 'line',
                    attributes: {
                        fill:             'none',
                        'pointer-events': 'none'
                    }
                }
            ]
        })

        // Definition of inheritance link
        this.joint.dia.Link.define('sml.Inherit', {
            attrs: {
                line: {
                    connection:     true,
                    stroke:         this.darkMode ? '#FFFFFF' : '#000000',
                    strokeWidth:    2,
                    strokeLinejoin: 'round',
                    targetMarker: {
                        type:           'path',
                        d:              'M 12 -7 12 7 0 0 z',
                        'stroke-width': 1,
                        fill:           this.darkMode ? '#000000' : '#FFFFFF',
                    }
                },
                wrapper: {
                    connection:     true,
                    strokeWidth:    10,
                    strokeLinejoin: 'round'
                }
            }
        }, 
        {
            markup: [
                {
                    tagName:  'path',
                    selector: 'wrapper',
                    attributes: {
                        fill:   'none',
                        cursor: 'pointer',
                        stroke: 'transparent'
                    }
                }, 
                {
                    tagName:  'path',
                    selector: 'line',
                    attributes: {
                        fill:             'none',
                        'pointer-events': 'none'
                    }
                }
            ]
        })

        // Definition of composition link
        this.joint.dia.Link.define('sml.Compose', {
            attrs: {
                line: {
                    connection:     true,
                    stroke:         this.darkMode ? '#FFFFFF' : '#000000',
                    strokeWidth:    2,
                    strokeLinejoin: 'round',
                    targetMarker: {
                        type:           'path',
                        d:              'M 10 -5 L 20 0 L 10 5 L 0 0 Z',
                        'stroke-width': 1,
                        fill:           '#000000'
                    }
                },
                wrapper: {
                    connection:     true,
                    strokeWidth:    10,
                    strokeLinejoin: 'round'
                }
            }
        }, 
        {
            markup: [
                {
                    tagName:  'path',
                    selector: 'wrapper',
                    attributes: {
                        fill:   'none',
                        cursor: 'pointer',
                        stroke: 'transparent'
                    }
                }, 
                {
                    tagName:  'path',
                    selector: 'line',
                    attributes: {
                        fill:             'none',
                        'pointer-events': 'none'
                    }
                }
            ]
        })
    }
}
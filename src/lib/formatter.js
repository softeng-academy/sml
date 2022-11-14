export default class Formatter {
    constructor (asty, astq) {
        this.asty = asty
        this.astq = astq
    }

    //  Generates DSL from AST
    format (ast) {
        //  Get top level elements and recursively fill them
        const parentBoxes = this.astq.query(ast, `/ Element`)
        let parentDSL = ast.get('space0')
        parentBoxes.forEach((box) => {
            parentDSL += this._generateElement(box)
        })
        parentDSL += ast.get('space1')
        return parentDSL
    }

    //  Takes AST and generates DSL with recommended formatting
    formatRecommended (ast) {
        //  Same as format, just omits spaces and sets them as recommended
        const parentBoxes = this.astq.query(ast, `/ Element`)
        let parentDSL = ast.get('space0')
        parentBoxes.forEach((box, index) => {
            parentDSL += this._generateElementWFormatting(box, 0)

            //  Add linebreaks between elements
            if (index !== parentBoxes.length - 1)
                parentDSL += '\n\n'
        })
        return parentDSL
    }

    //  Generates a single element and its children
    _generateElementWFormatting (ast, tabs) {
        //  Find out correct amount of spaces
        let tabsString = ''
        for (let i = 0; i < tabs; i++)
            tabsString += '    '

        //  Initialize DSL
        let dsl = tabsString

        //  Add signature text to the DSL
        //  e.g. User: entity { \n
        dsl += ast.child(0).get('label') + ':' + ast.child(0).get('type')

        // Add constraint text to the DSL
        const constraint = ast.child(0).get('constraint')
        if (constraint)
            dsl +=  constraint !== '*' ? ` ${constraint}` : `${constraint}`

        //  Add tags text to the DSL
        const boxTags = ast.child(0).C
        let tagString = ''
        boxTags.forEach((tag) => {
            tagString += ` @${tag.get('name')}`
            if (tag.get('args')) {
                const tagJustJoin = ['pos', 'dock', 'inherit' ]
                if (tagJustJoin.includes(tag.get('name')))
                    tagString += `(${tag.get('args').join(', ')})`
                else
                    tagString += `("${tag.get('args').join('", "')}")`
            }
        })
        dsl += tagString

        if (ast.child(1)?.T === 'Spec') {
            dsl += ' {'

            //  Check for top-level-node attributes
            this.astq.query(ast, `/ Spec / Element`).forEach((node) => {
                dsl += '\n'
                dsl += this._generateElementWFormatting(node, tabs + 1)
            })

            dsl += `\n${tabsString}}`
        }
        
        return dsl
    }

    _generateElement (node) {
        //  Set label, type and constraint
        const label = 
            (node.child(0).get('label') ? node.child(0).get('label') + (node.child(0).get('labelSpace1') ?? '') + ':' : '') + 
            (node.child(0).get('labelSpace2') ?? '')

        //  Set type andd constraint
        const type       = node.child(0).get('type')
        const constraint = node.child(0).get('constraint') ?? ''

        //  Set tags string
        let tags = ''
        const tagNodes = node.child(0).C
        for (let i = 0; i < tagNodes.length; i++) {
            tags +=
                (tagNodes[i].get('space0') ? tagNodes[i].get('space0').replaceAll(',', '') : '') +
                '@' +
                tagNodes[i].get('name') +
                (tagNodes[i].get('space1') ? tagNodes[i].get('space1').replaceAll(',', '') : '')
            if (tagNodes[i].get('args')) {
                tags +=
                '(' +
                (tagNodes[i].get('space2') ? tagNodes[i].get('space2').replaceAll(',', '') : '') +
                tagNodes[i].get('args') +
                (tagNodes[i].get('space3') ? tagNodes[i].get('space3').replaceAll(',', '') : '') +
                ')'
            }
        }

        //  Assemble signature
        const signature = label + type + (node.child(0).get('space4') ?? '') + constraint + tags + (node.child(0).get('space1') ?? '')

        //  Assemble spec if spec is present
        let spec = ''
        if (node.C.length > 1) {
            spec += '{' + (node.get('trailing0') ?? '') + (node.child(1).get('space0') ?? '')
            this.astq.query(node, `/ Spec / Element`).forEach((child) => {
                spec += this._generateElement(child)
            })
            spec += node.child(1).get('space1') ?? ''
            spec += (node.get('space2') ?? '') + '}'
        }
        const dsl = (node.get('space0') ?? '') + signature + (node.get('space1') ?? '') + spec + (node.get('space3') ?? '')
        return dsl
    }
}
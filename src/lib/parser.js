import PEG             from 'pegjs'
import PEGUtil         from 'pegjs-util'
import sourceCodeError from 'source-code-error'
import fs              from 'fs'
import grammar         from './grammar.pegjs'

export default class Parser {
    constructor (asty, astq) {
        this.asty = asty
        this.astq = astq
    }

    parse (dsl) {
        const generationResult = this._generateAST(dsl)
        if (generationResult.ast)
            return { result: this._validateAST(generationResult.ast, dsl), ast: generationResult.ast }
        else
            return { result: generationResult.result, ast: null }
    }

    _generateAST (input) {
        let data
        let intermediate = grammar ?? PEG.generate(fs.readFileSync('./grammar.pegjs', 'utf8'))

        try {
            data = {
                spec: PEGUtil.parse(intermediate, input, {
                    startRule: 'Spec',
                    makeAST: (line, column, offset, args) => 
                        this.asty.create.apply(this.asty, args).pos(line, column, offset)
                })
            }
            //  Check if content is correct
            if (!data.spec.ast) {
                const error = data.spec.error
                const report = {}
                report.src = sourceCodeError({
                    message: error.message,
                    line:    error.line,
                    column:  error.column,
                    length:  error.found?.length ?? 1,
                    code:    input,
                    colors:  true,
                    newline: false
                })
                report.line    = error.line
                report.column  = error.column
                report.length  = error.found?.length ?? 1
                report.message = error.message
                return { result: { valid: false, errors: [ report ] }, ast: null }
            }
            else {
                const all = this.astq.query(data.spec.ast, `// *`)
                all.forEach((x) => {
                    x.set('id', crypto.randomUUID())
                })
                return { ast: data.spec.ast }
            }
        }
        catch (error) {
            return { result: { valid: false, errors: [] }, ast: null }
        }
    }

    _validateAST (ast, input) {
        let valid = true
        const sourceCodeErrors = []
        const warnings = [] //  used for recommendations
        const portEnum = [ 'lt', 'lm', 'lb', 'bl', 'bm', 'br', 'rb', 'rm', 'rt', 'tr', 'tm', 'tl' ]
        const stdTypes = [ 'entity', 'enumeration', 'note', 'device', 'actor', 'program', 'network', 'cluster', 'container',
            'thread', 'module', 'component', 'function', 'artifact', 'tier', 'area', 'layer', 'slice', 'state', 'transition',
            'compound', 'vgroup', 'hgroup', 'type' ]
        const basicTypes = [ 'string', 'int', 'integer', 'boolean', 'float' ]

        //  Ensure that every attribute name exists only once
        let signatures = this.astq.query(ast, `// Element [ / Spec ] / Signature`)
        signatures.forEach((sig, index) => {
            for (let i = index + 1; i < signatures.length; i++) {
                if (sig.get('label') === signatures[i].get('label')) {
                    valid = false
                    let message = `The following names appear more than once: ${sig.get('label')}`
                    sourceCodeErrors.push({
                        src: sourceCodeError({
                            message: message,
                            code:    input,
                            line:    sig.pos().line,
                            column:  sig.pos().column,
                            length:  sig.get('label').length ?? 1,
                            colors:  true,
                            newline: false
                        }),
                        line    : sig.pos().line,
                        column  : sig.pos().column,
                        length  : sig.get('label').length ?? 1,
                        message : message
                    })
                    message = `The following names appear more than once: ${signatures[i].get('label')}`
                    sourceCodeErrors.push({
                        src : sourceCodeError({
                            message: message,
                            code:    input,
                            line:    signatures[i].pos().line,
                            column:  signatures[i].pos().column,
                            length:  signatures[i].get('label').length,
                            colors:  true,
                            newline: false
                        }),
                        line    : signatures[i].pos().line,
                        column  : signatures[i].pos().column,
                        length  : signatures[i].get('label').length,
                        message : message
                    })
                }
            }
        })

        //  No elements with basic or other types exist
        signatures.forEach((sig) => {
            if (!stdTypes.includes(sig.get('type')) && sig.P?.child(1)?.T === 'Spec' ) {
                valid = false
                let message = `The type ${sig.get('type')} is not allowed to be a box`
                sourceCodeErrors.push({
                    src: sourceCodeError({
                        message: message,
                        code:    input,
                        line:    sig.pos().line,
                        column:  this._getTypeColumn(sig),
                        length:  sig.get('type').length ?? 1,
                        colors:  true,
                        newline: false
                    }),
                    line    : sig.pos().line,
                    column  : this._getTypeColumn(sig),
                    length  : sig.get('type').length ?? 1,
                    message : message
                })
            }
        })
        
        
        //  Elements without spec are not allowed to be stdTypes
        let signaturesNoSpecReq = this.astq.query(ast, `// Element/Signature`)
        signaturesNoSpecReq.forEach((sig) => {
            if (stdTypes.includes(sig.get('type')) && sig.P?.child(1)?.T !== 'Spec' ) {
                valid = false
                let message = `The type ${sig.get('type')} is only allowed with following {}`
                sourceCodeErrors.push({
                    src: sourceCodeError({
                        message: message,
                        code:    input,
                        line:    sig.pos().line,
                        column:  sig.pos().column,
                        length:  this._getTypeColumn(sig) + sig.get('type').length ?? 1,
                        colors:  true,
                        newline: false
                    }),
                    line    : sig.pos().line,
                    column  : sig.pos().column,
                    length  : this._getTypeColumn(sig) + sig.get('type').length ?? 1,
                    message : message
                })
            }
        })
        
        //  Elements without a spec need to be inside a spec of an element
        let elems = this.astq.query(ast, `// Element [ !/ Spec ]`)
        elems.forEach((elem) => {
            if (!elem.P.P) {
                valid = false
                let message = `The attribute ${elem.child(0).get('label')} has to be inside of a box`
                sourceCodeErrors.push({
                    src: sourceCodeError({
                        message: message,
                        code:    input,
                        line:    elem.pos().line,
                        column:  elem.pos().column,
                        length:  elem.child(0).get('label').length ?? 1,
                        colors:  true,
                        newline: false
                    }),
                    line    : elem.pos().line,
                    column  : elem.pos().column,
                    length  : elem.child(0).get('label').length ?? 1,
                    message : message
                })
            }
        })

        // Ensure that tags are not duplicated
        this.astq.query(ast, `// Signature [ / Tag [ @name ] ] `).forEach((node) => {
            const alreadyFlagged = []
            const tags = node.C
            for (let i = 0; i < tags.length; i++) {
                const tag1 = tags[i]
                for (let j = i + 1; j < tags.length; j++) {
                    const tag2 = tags[j]
                    if (tag1.get('name') === tag2.get('name') && !alreadyFlagged.includes(tag1.get('name'))) {
                        valid = false
                        alreadyFlagged.push(tag1.get('name'))
                        let message = `The tag ${tag1.get('name')} appears twice in ${node.get('label')}`
                        sourceCodeErrors.push({
                            src : sourceCodeError({
                                message: message,
                                code:    input,
                                line:    tag1.pos().line,
                                column:  tag1.pos().column,
                                length:  tag1.get('name').length + 1, //  add one for @ character
                                colors:  true,
                                newline: false
                            }),
                            line    : tag1.pos().line,
                            column  : tag1.pos().column,
                            length  : tag1.get('name').length + 1, //  add one for @ character
                            message : message
                        })
                        message = `The tag ${tag2.get('name')} appears twice in ${node.get('label')}`
                        sourceCodeErrors.push({
                            src: sourceCodeError({
                                message: message,
                                code:    input,
                                line:    tag2.pos().line,
                                column:  tag2.pos().column,
                                length:  tag2.get('name').length + 1, //  add one for @ character
                                colors:  true,
                                newline: false
                            }),
                            line:   tag2.pos().line,
                            column: tag2.pos().column,
                            length: tag2.get('name').length + 1, //  add one for @ character
                            message:  message
                        })
                        break
                    }
                }
            }
        })

        //  Start and end tag in the same state
        this.astq.query(ast, `// Signature [ @type == "state" && / Tag [ @name ] ]`).forEach((node) => {
            const tags = node.C
            let startFound
            let endFound = false
            for (let i = 0; i < tags.length; i++) {
                if (tags[i].get('name') === 'start')
                    startFound = true
                else if (tags[i].get('name') === 'end') 
                    endFound = true
            }
            if (startFound && endFound) {
                valid = false
                const message = `Signature ${node.get('label')} has both the start and end tag`
                sourceCodeErrors.push({
                    src : sourceCodeError({
                        message: message,
                        code:    input,
                        line:    node.pos().line,
                        column:  node.pos().column,
                        length:  node.get('label').length,
                        colors:  true,
                        newline: false
                    }),
                    line    : node.pos().line,
                    column  : node.pos().column,
                    length  : node.get('label').length,
                    message : message
                })
            }
        })

        //  Start and end tag only in signature of type state
        this.astq.query(ast, `// Signature [ @type != "state" && // Tag [ @name ] ]`).forEach((node) => {
            const tags = node.C
            for (let i = 0; i < tags.length; i++) {
                if (tags[i].get('name') === 'start' || tags[i].get('name') === 'end') {
                    valid = false
                    const message = `The box is of type ${node.get('type')} but contains the tag ${tags[i].get('name')}`
                    sourceCodeErrors.push({
                        src : sourceCodeError({
                            message: message,
                            code:    input,
                            line:    node.pos().line,
                            column:  node.pos().column,
                            length:  node.get('label').length,
                            colors:  true,
                            newline: false
                        }),
                        line    : node.pos().line,
                        column  : node.pos().column,
                        length  : node.get('label').length,
                        message : message
                    })
                }
            }
        })
        
        //  Start and end tag only in signature of type state
        this.astq.query(ast, `// Element [ / Spec ] / Signature [ // Tag [ @name ] ]`).forEach((node) => {
            const tags = node.C
            for (let i = 0; i < tags.length; i++) {
                let unacceptedTags = ['dock', 'inherit', 'compose']
                if (unacceptedTags.includes(tags[i].get('name'))) {
                    valid = false
                    const message = `The tag ${tags[i].get('name')} is not applicable for a box`
                    sourceCodeErrors.push({
                        src : sourceCodeError({
                            message: message,
                            code:    input,
                            line:    tags[i].pos().line,
                            column:  tags[i].pos().column,
                            length:  tags[i].get('name').length + 1 ?? 1 ,
                            colors:  true,
                            newline: false
                        }),
                        line    : node.pos().line,
                        column:  tags[i].pos().column,
                        length:  tags[i].get('name').length + 1 ?? 1 ,
                        message : message
                    })
                }
            }
        })

        //  Test associations
        const speclessSignatures = this.astq.query(ast, `// Signature [ !+// Spec ]`)
        const allSignatures = this.astq.query(ast, `// Signature`)
        for (let i = 0; i < speclessSignatures.length; i++) {
            let associationFound = false
            if (typeof speclessSignatures[i].get('type') !== 'object') {
                //  Check if given target is either a std type or a basic type
                if (!stdTypes.includes(speclessSignatures[i].get('type')) &&
                    !basicTypes.includes(speclessSignatures[i].get('type'))) {
                    for (let j = 0; j < allSignatures.length; j++)
                        if (speclessSignatures[i].get('type') === allSignatures[j].get('label'))
                            associationFound = true
                    if (!associationFound) {
                        valid = false
                        const message = `Could not find the association type ${speclessSignatures[i].get('type')}` + 
                            `${speclessSignatures[i].get('label') ? ' of ' + speclessSignatures[i].get('label') : ''}`
                        sourceCodeErrors.push({
                            src : sourceCodeError({
                                message: message,
                                code:    input,
                                line:    speclessSignatures[i].pos().line,
                                column:  speclessSignatures[i].pos().column,
                                length:  this._getTypeColumn(speclessSignatures[i]) + speclessSignatures[i].get('type').length,
                                colors:  true,
                                newline: false
                            }),
                            line    : speclessSignatures[i].pos().line,
                            column  : speclessSignatures[i].pos().column,
                            length  : this._getTypeColumn(speclessSignatures[i]) + speclessSignatures[i].get('type').length,
                            message : message
                        })
                    }
                }
            }
            else {
                //  Find the destination
                const destination = this.astq.query(ast, `// Signature [ @label == {label} && 
                    +/ * // Signature [ @type == {type} ] ]`, {label: speclessSignatures[i].get('type')[0], type: speclessSignatures[i].get('type')[2]})
                if (destination.length === 0) {
                    valid = false
                    const message = `The association destination ${speclessSignatures[i].get('type')} could not be found`
                    sourceCodeErrors.push({
                        src : sourceCodeError({
                            message: message,
                            code:    input,
                            line:    speclessSignatures[i].pos().line,
                            column:  speclessSignatures[i].pos().column,
                            length:  speclessSignatures[i].get('length'),
                            colors:  true,
                            newline: false
                        }),
                        line    : speclessSignatures[i].pos().line,
                        column  : speclessSignatures[i].pos().column,
                        length  : speclessSignatures[i].get('length'),
                        message : message 
                    })
                }
            }

            //  Check target ports
            if (speclessSignatures[i].C.length > 0) {
                if (speclessSignatures[i].child(0).T === 'Tag') {
                    const tag = speclessSignatures[i].child(0)
                    if (tag.get('args')) {
                        const astSP = tag.get('args')[0].replaceAll('"', '')
                        const astTP = tag.get('args')[1].replaceAll('"', '')
                        if (!portEnum.includes(astSP)) {
                            valid = false
                            const message = `Could not find the dock ${astSP} of ${speclessSignatures[i].get('label')}`
                            sourceCodeErrors.push({
                                src : sourceCodeError({
                                    message: message,
                                    code:    input,
                                    line:    tag.pos().line,
                                    column:  tag.pos().column,
                                    length:  tag.get('name').length + 1 ?? 1 ,
                                    colors:  true,
                                    newline: false
                                }),
                                line    : tag.pos().line,
                                column  : tag.pos().column,
                                length:  tag.get('name').length + 1 ?? 1 ,
                                message : message
                            })
                        }
                        if (!portEnum.includes(astTP)) {
                            valid = false
                            const message = `Could not find the dock ${astTP} of ${speclessSignatures[i].get('label')}`
                            sourceCodeErrors.push({
                                src : sourceCodeError({
                                    message: message,
                                    code:    input,
                                    line:    tag.pos().line,
                                    column:  tag.pos().column,
                                    length:  tag.get('name').length + 1 ?? 1 ,
                                    colors:  true,
                                    newline: false
                                }),
                                line    : tag.pos().line,
                                column  : tag.pos().column,
                                length:  tag.get('name').length + 1 ?? 1 ,
                                message : message
                            })
                        }
                    }
                }
            }
        }

        //  Recommendations
        //  Elements should be written with capital letter first
        this.astq.query(ast, `// Signature [ +// Spec ]`).forEach((sig) => {
            if (sig.get('label') && !/^[A-Z]/.test(sig.get('label')) && !basicTypes.includes(sig.get('type'))) {
                const message = `Custom element ${sig.get('label')} should be written with a leading capital letter`
                warnings.push({
                    src : sourceCodeError({
                        message: message,
                        code:    input,
                        line:    sig.pos().line,
                        column:  sig.pos().column,
                        length:  sig.get('label').length ?? 1,
                        colors:  true,
                        newline: false,
                        type:    'WARNING'
                    }),
                    line    : sig.pos().line,
                    column  : sig.pos().column,
                    length  : sig.get('label').length ?? 1,
                    message : message
                })
            }
        })

        /*
        TODO: Check wether needed or not
        //  Types that are not standard should be written with first capital
        this.astq.query(ast, `// Signature [ @type != null ]`).forEach((sig) => {
            if ((!stdTypes.includes(sig.get('type')) && !basicTypes.includes(sig.get('type'))) && !/^[A-Z]/.test(sig.get('type'))) {
                const message =  `The type ${sig.get('type')} does not start with a capital letter`
                warnings.push({
                    src : sourceCodeError({
                        message: message,
                        code:    input,
                        line:    sig.pos().line,
                        column:  this._getTypeColumn(sig),
                        length:  sig.get('type').length,
                        colors:  true,
                        newline: false,
                        type:    'WARNING'
                    }),
                    line    : sig.pos().line,
                    column  : this._getTypeColumn(sig),
                    length  : sig.get('type').length,
                    message : message
                })
            }
        })
        */

        //   Return result object
        return { valid, warnings, errors: sourceCodeErrors }
    }

    _getTypeColumn(sig) {
        return sig.pos().column + sig.get('label').length + 1 + sig.get('labelSpace1').length + sig.get('labelSpace2').length ?? 1
    }
}
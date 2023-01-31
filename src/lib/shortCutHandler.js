export default class ShortCutHandler {
    constructor () {
        this.copiedData = null
        this.cut = false
    }

    //  Handles the different short cuts available
    handleKeyPress (e, node, sml, editor) {
        //  No node selected guard
        if (!node) return;
        
        //  Delete
        if (e.type === 'keydown' && (e.key === 'Delete' || e.key === 'Backspace'))
            sml.applyRemove(node.get('id'))
        //  CTRL + c: Copy
        else if (e.type === 'keydown' && e.key === 'c' && e.ctrlKey) {
            this.cut = false
            this.copiedData = node
        }
        //  CTRL + x: Cut
        else if (e.type === 'keydown' && e.key === 'x' && e.ctrlKey) {
            this.cut = true
            this.copiedData = node
        }
        //  CTRL + v: Paste
        else if (e.type === 'keydown' && e.key === 'v' && e.ctrlKey) {
            if (this.copiedData && !this.cut)
                sml.handlePaste(this.copiedData)
            else 
                sml.handleCut(this.copiedData)
        }
        //  CTRL + z: Undo
        else if (e.type === 'keydown' && e.key === 'z' && e.ctrlKey)
            editor.undo()
        //  CTRL + Z: Redo
        else if (e.type === 'keydown' && e.key === 'Z' && e.ctrlKey)
            editor.redo()
    }
}

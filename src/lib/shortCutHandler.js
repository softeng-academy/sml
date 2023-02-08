export default class ShortCutHandler {
    constructor () {
        this.copiedData = null
        this.cut = false
    }

    //  Handles the different short cuts available
    handleKeyPress (e, node, sml, editor, save) {
        //  CTRL + z: Undo
        if (e.type === 'keydown' && e.key === 'z' && e.ctrlKey)
            editor.undo()
        //  CTRL + Z: Redo
        else if (e.type === 'keydown' && e.key === 'Z' && e.ctrlKey)
            editor.redo()
        //  CTRL + s: Save
        else if (e.type === 'keydown' && e.key === 's' && e.ctrlKey)
            save()

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
        //  Arrow Right
        else if (e.type === 'keydown' && e.key === 'ArrowRight')
            sml.moveBox(node, 1, 0)
        //  Arrow Left
        else if (e.type === 'keydown' && e.key === 'ArrowLeft')
            sml.moveBox(node, -1, 0)
        //  Arrow Up
        else if (e.type === 'keydown' && e.key === 'ArrowUp')
            sml.moveBox(node, 0, -1)
        //  Arrow Down
        else if (e.type === 'keydown' && e.key === 'ArrowDown')
            sml.moveBox(node, 0, 1)
    }
}

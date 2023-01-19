export default class Layouter {
    constructor (sml, astq, asty) {
        this.sml = sml
        this.astq = astq
        this.asty = asty
    }

    positionPositionlessElements(ast, paper, graph) {
        //  Get all elements that are positioned and that are not positioned with their areas
        let nonPositionedElements      = this.astq.query(ast, `/ Element [ / Spec && ! */Signature/Tag [@name == "pos"] ] `)
        let nonPositionedElementsIds   = nonPositionedElements.map(elem => elem.get('id'))
        let nonPositionedElementsAreas = []
        let positionedElements         = this.astq.query(ast, `/ Element [ / Spec && */Signature/Tag [@name == "pos"] ] `)
        let positionedElementsIds      = positionedElements.map(elem => elem.get('id'))
        let positionedElementsIdsAreas = []
        graph.getCells().forEach(elem => {
            if (nonPositionedElementsIds.includes(elem.attributes.technicalId))
                nonPositionedElementsAreas.push({ area: elem.getBBox(), id: elem.attributes.technicalId})
            if (positionedElementsIds.includes(elem.attributes.technicalId))
                positionedElementsIdsAreas.push({ area: elem.getBBox(), id: elem.attributes.technicalId})
        })

        //  Get currently viewable area
        let positions = []
        var bcr = paper.svg.getBoundingClientRect();
        var viewableArea = paper.clientToLocalRect({ x: bcr.left, y: bcr.top, width: bcr.width, height: bcr.height });

        //  Search the correct position for each non positioned element
        for (const nonPositionedArea of nonPositionedElementsAreas) {
            let width = nonPositionedArea.area.width, height = nonPositionedArea.area.height 
            let margin = 50
            let startX = viewableArea.x + margin, startY = viewableArea.y + margin
            let positioned = false
            do {
                let noInterception = true

                //  First line has no space left, break line and start new
                if (viewableArea.x + viewableArea.width < startX) {
                    startX = viewableArea.x + margin
                    startY = startY + 100
                }

                //  No free space was found, place elem in upper left corner
                if (viewableArea.y + viewableArea.height < startY) {
                    let newArea = {area: {x: viewableArea.x + margin, y: viewableArea.y + margin, width: width, height: height}, id: nonPositionedArea.id}
                    positions.push(newArea)
                    positionedElementsIdsAreas.push(newArea)
                    positioned = true
                }

                //  Check if current non positioned area overlaps with any positioned element area
                for (const positionedArea of positionedElementsIdsAreas) {
                    if (this.rectanglesIntersect(startX, startY, startX + width, startY + height,
                        positionedArea.area.x, positionedArea.area.y, positionedArea.area.x + positionedArea.area.width, positionedArea.area.y + positionedArea.area.height)) {
                        noInterception = false
                    }
                }

                //  If there is no interception, save that location and add it to the taken areas
                if (noInterception) {
                    let newArea = {area: {x: startX, y: startY, width: width, height: height}, id: nonPositionedArea.id}
                    positions.push(newArea)
                    positionedElementsIdsAreas.push(newArea)
                    positioned = true
                }

                //  Only increase startX if elem was not positioned
                if (!positioned)
                    startX = startX + 100
            } while (!positioned);
        }

        //  If there are positions, add their position tags and regenerate
        if (positions.length > 0)
            this._addPosTagsViaAreas(positions, nonPositionedElements, ast)
    }

    //  Searches the new positions for each element and adds the pos tag accordingly
    _addPosTagsViaAreas(areas, nonPositionedElements, ast) {
        for (const elem of nonPositionedElements) {
            let correspondingArea = areas.find(x => x.id === elem.get('id'))
            const newPosTag = this.asty.create('Tag').set({ name: 'pos', args: [ Math.round(correspondingArea.area.x / 10), Math.round(correspondingArea.area.y / 10) ], id: crypto.randomUUID()})
            if (elem.child(0).get('space4').length === 0)                            
                newPosTag.set('space0', ' ')
            elem.child(0).add(newPosTag)
        }
        
        //  Regenerates both DSL and AST
        this.sml.regenerateDSLOnASTChanges(ast)
    }

    //  Checks if two rectangles overlap
    rectanglesIntersect( 
        minAx, minAy, maxAx, maxAy,
        minBx, minBy, maxBx, maxBy ) {
        let aLeftOfB = maxAx < minBx;
        let aRightOfB = minAx > maxBx;
        let aAboveB = minAy > maxBy;
        let aBelowB = maxAy < minBy;

        return !( aLeftOfB || aRightOfB || aAboveB || aBelowB );
    }
}
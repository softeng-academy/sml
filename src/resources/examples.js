export const entityModelExample = `Professor: entity @pos(5,5){
    professorId: string
    name:        string
    rank:        string
    room:        int 
}

Student: entity @pos(45,5){
    studentId: string
    name:      string
    semester:  int
    visits:    Lecture*
}

Assistant: entity @pos(5,40){
    assistantId:     string
    name:            string
    areaOfExpertise: string
    room:            int 
    supervisor:      Professor[1] @dock("tl","bl")
}

Exam: entity @pos(45,40){
    takesExam:   Student[1]
    isAbout:     Lecture+ @dock("tr","bl")
    providedBy:  Professor+ @dock("tl","br")
    result:      int
}

Lecture: entity @pos(85,5){
    lectureId:    string
    title:        string
    hoursPerWeek: float
    visitedBy:    Student* @dock("lt","rt")
    predecessor:  Lecture* @dock("tr","rt")
    successor :   Lecture* @dock("rb","br")
    consistsOf:   LectureUnit* @compose("rm","lm")
}

LectureUnit: entity @pos(125,5){
    subject: string
}`

export const stateDiagram = `Opened: state @pos(5,5) @start {
    close: Closed @dock("rt","lt")
}

Closed: state @pos(35,5){
    lock: Locked @dock("rt","lt")
    open: Opened @dock("lb","rb")
}

Locked: state @pos(65,5){
    unlock : Closed @dock("lb","rb")
}`

export const SMLArchitecture = `SmlGUI:layer @pos(5,37) {
    SVG:artifact {
        propagateGuiEvent: Updater @dock("rb","lt")
    }
}

SmlLibrary:layer @pos(40,5) {
    Ast:entity @pos(39,30) {
        updateDiagram: Generator @dock("lt","rb")
        format:        Formatter @dock("rb","lt")
    }
    JointJSManager:component {
        Generator:component {
            drawDiagram: SVG @dock("lm","rt")
        }
        Updater:component @pos(0,48) {
            updateDataModel: Ast @dock("rt","lb")
        }
    }
    Parser:component @pos(70,7) {
        update: Ast @dock("bl","rt")
    }
    Formatter:component  @pos(70,53){
        write: SmlFiles @dock("rm","lb")
    }
}

SmlFiles:entity @pos(145,40) {
    read: Parser @dock("lt","rm")
}`
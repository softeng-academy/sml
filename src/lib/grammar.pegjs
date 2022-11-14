{
    var unroll = options.util.makeUnroll(location, options)
    var ast    = options.util.makeAST   (location, options)
}

Spec
= s0:t_ elems:Element* s1:_
    {
        let space0        = s0 ? s0.flat(3).join("").replaceAll("\r","") : ""
        let space1        = s1 ? s1.flat(3).join("").replaceAll("\r","") : ""

        return ast("Spec").set({
            space0,
            space1,
            })
            .add(elems)
    }

Element
 = s0:l_ sig:Signature s1:_ "{" spec:Spec? "}" s3:t_
    {
        let space0 = s0 ? s0.flat(3).join("") : ""
        let space1 = s1 ? s1.flat(3).join("") : ""
        let space3 = s3 ? s3.flat(3).join("") : ""
        
        return ast("Element").add(sig, spec).set({
            space0,
            space1,
            space3,
            })
    }
 / s0:l_ sig:Signature s3:t_
    {
        let space0 = s0 ? s0.flat(3).join("") : ""
        let space3 = s3 ? s3.flat(3).join("") : ""
        return ast("Element").add(sig).set({
            space0,
            space3,
            })
    }
/ text:QuotedStringWithSpaces _
    {
        return ast("Content").set({text})
    }

Signature
 = label:(Name l_ ":" l_ )? type:TypeName s4:l_ constraint:Constraint? tag:Tag*
    {
        let labelSpace1 = label ? (label[1][0] ? label[1].flat(3).join("") : "") : ""
        let labelSpace2 = label ? (label[3][0] ? label[3].flat(3).join("") : "") : ""
        let space4 = s4 ? s4.flat(3).join("") : ""
        let label2      = label ? label[0] : ""

        return ast("Signature").set({
            type, 
            label: label2, 
            constraint: constraint ? constraint : '', 
            labelSpace1,
            labelSpace2,
            space4
            })
            .add(tag)
    }

Tag
 = s0:l_ "@" tagName:TagNameStd s1:l_ "(" s2:l_ args:ArgList?  s3:l_ ")" 
    {
        let space0 = s0 ? s0.flat(3).join("") : ""
        let space1 = s1 ? s1.flat(3).join("") : ""
        let space2 = s2 ? s2.flat(3).join("") : ""
        let space3 = s3 ? s3.flat(3).join("") : "" 

        return ast("Tag").set({
            name: tagName, 
            args, 
            space0,
            space1,
            space2,
            space3,
            })
    }
 / s0:l_ "@" tagName:TagNameStd s1:l_
    {
        let space0 = s0 ? s0.flat(3).join("") : ""
        let space1 = s1 ? s1.flat(3).join("") : ""

        return ast("Tag").set({
            name: tagName, 
            space0,
            space1,
            })
    }

ArgList
= arg:(Arg / $([0-9]+)) l_ "," l_ al:(ArgList / $([0-9]+))
    {
        return [arg].concat(al)
    }
 / arg:Arg
    {
        return [arg]
    }
 
Arg
= s:$(("\"" Bareword "\""))
    {
        return s
    }

Constraint
 = constraint:(l_ (Arity / Expression))
    {
        return constraint.join("")
    } 

Arity
 = "?" / "*" / "+"
  
Expression
 = content:("[" l_ StringWithSpaces l_ "]")
    {
        return content.flat(3).join("")
    }
  
Name
 = Bareword
  
TypeName
 = TypeNameStd / BasicTypes / (Name "." Name) / (Name)

TypeNameStd
 =    "entity" / "enumeration" 
    /* / "note" */ 
    / "device" /  "actor" / "program"
    / "network" / "cluster" / "container" / "thread" 
    / "module" / "component" / "function" / "artifact" 
    / "tier" / "area" / "layer" / "slice" 
    / "state" / "transition" 
    / "compound" / "vgroup" / "hgroup" /
      "type"
	                
TagNameStd
= 	  "ordered" / "unique"
  	/ "inherit" / "compose" 
    / "dock" / "pos"
    / "hint" / "genericTag"
    / "call" / "call-back" / "one-way" / "generic"
    / "start" / "end"

BasicTypes
= "string" / "int" / "integer" / "boolean" / "float"

QuotedStringWithSpaces
= $("\"" _ (!"\"" .)+ _ "\"")

StringWithSpaces
= $((!"[" !"]" .)+)

Bareword
= $([a-zA-Z0-9]+)

StringEscapedCharDQ "escaped double-quoted-string character"
 =      "\\\\" { return "\\"   }
    /   "\\\"" { return "\""   }
    /   "\\b"  { return "\b"   }
    /   "\\v"  { return "\x0B" }
    /   "\\f"  { return "\f"   }
    /   "\\t"  { return "\t"   }
    /   "\\r"  { return "\r"   }
    /   "\\n"  { return "\n"   }
    /   "\\e"  { return "\x1B" }
    /   "\\x" n:$([0-9a-fA-F][0-9a-fA-F]) { return String.fromCharCode(parseInt(n, 16))}
    /   "\\u" n:$([0-9a-fA-F][0-9a-fA-F][0-9a-fA-F][0-9a-fA-F]) {return String.fromCharCode(parseInt(n, 16))}

_ "optional blank"
 =   (co / ws)*

l_ "optional blank"
 =   (co / leading)*

t_ "optional blank"
 =   (co / trailing)*

co "multi-line comment"
 =   "/*" (!"*/" .)* "*/"

ws "any whitespaces"
 =   [ \t\r\n]+

leading "intendation"
 =   [ \t]+

trailing "spaces with enforced linebreak"
 =   ([ \t]*[\r]?[\n])+


   
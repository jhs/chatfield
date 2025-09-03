/**
 * Builder API for creating Chatfield interviews.
 * Mirrors Python's builder.py
 */

import { Interview } from './interview'

/**
 * Builder for trait.possible() pattern.
 * Mirrors Python's TraitBuilder
 */
export class TraitBuilder {
  parent: RoleBuilder
  role: string

  constructor(parent: RoleBuilder, role: string) {
    this.parent = parent
    this.role = role
  }

  call(trait: string): RoleBuilder {
    // Add a regular trait
    this.parent._addTrait(this.role, trait)
    return this.parent
  }

  possible(name: string, trigger: string = ""): RoleBuilder {
    // Add a possible trait with optional trigger guidance
    this.parent._addPossibleTrait(this.role, name, trigger)
    return this.parent
  }
}

/**
 * Builder for alice/bob role configuration.
 * Mirrors Python's RoleBuilder
 */
export class RoleBuilder {
  parent: ChatfieldBuilder
  role: string
  trait: TraitBuilder

  constructor(parent: ChatfieldBuilder, role: string) {
    this.parent = parent
    this.role = role
    this._ensureRole()
    // Set context for subsequent calls
    this.parent._currentRole = role
    this.trait = new TraitBuilder(this, role)
  }

  private _ensureRole(): void {
    // Ensure role exists in chatfield structure
    if (!(this.role in this.parent._chatfield.roles)) {
      this.parent._chatfield.roles[this.role] = {
        type: null,
        traits: [],
        possible_traits: {}
      }
    }
  }

  type(roleType: string): RoleBuilder {
    // Set the role type
    this.parent._chatfield.roles[this.role].type = roleType
    return this
  }

  _addTrait(role: string, trait: string): void {
    // Add a regular trait
    if (!this.parent._chatfield.roles[role].traits.includes(trait)) {
      this.parent._chatfield.roles[role].traits.push(trait)
    }
  }

  _addPossibleTrait(role: string, name: string, trigger: string): void {
    // Add a possible trait
    this.parent._chatfield.roles[role].possible_traits[name] = {
      active: false,
      desc: trigger
    }
  }

  field(name: string): FieldBuilder {
    // Start defining a new field
    return this.parent.field(name)
  }

  alice(): RoleBuilder {
    // Switch to alice configuration
    return this.parent.alice()
  }

  bob(): RoleBuilder {
    // Switch to bob configuration
    return this.parent.bob()
  }

  build(): Interview {
    // Build the final Interview
    return this.parent.build()
  }
}

/**
 * Builder for cast decorators with sub-attributes.
 * Mirrors Python's CastBuilder
 */
export class CastBuilder {
  parent: FieldBuilder
  baseName: string
  primitiveType: any
  basePrompt: string

  constructor(parent: FieldBuilder, baseName: string, primitiveType: any, basePrompt: string) {
    this.parent = parent
    this.baseName = baseName
    this.primitiveType = primitiveType
    this.basePrompt = basePrompt
  }

  call(prompt?: string): FieldBuilder {
    // Apply the base cast
    const castInfo = {
      type: typeof this.primitiveType === 'function' ? this.primitiveType.name.toLowerCase() : String(this.primitiveType),
      prompt: prompt || this.basePrompt
    }
    this.parent._chatfieldField.casts[this.baseName] = castInfo
    return this.parent
  }

  // Dynamic sub-attributes handled via Proxy in the parent FieldBuilder
  [key: string]: any
}

/**
 * Builder for choice cardinality decorators.
 * Mirrors Python's ChoiceBuilder
 */
export class ChoiceBuilder {
  parent: FieldBuilder
  baseName: string
  null: boolean
  multi: boolean

  constructor(parent: FieldBuilder, baseName: string, nullAllowed: boolean, multi: boolean) {
    this.parent = parent
    this.baseName = baseName
    this.null = nullAllowed
    this.multi = multi
  }

  // Dynamic sub-attributes handled via Proxy in the parent FieldBuilder
  [key: string]: any
}

/**
 * Builder for individual fields.
 * Mirrors Python's FieldBuilder
 */
export class FieldBuilder {
  parent: ChatfieldBuilder
  name: string
  _chatfieldField: any
  
  // Cast builders
  as_int: CastBuilder
  as_float: CastBuilder
  as_bool: CastBuilder
  as_str: CastBuilder
  as_percent: CastBuilder
  as_list: CastBuilder
  as_set: CastBuilder
  as_dict: CastBuilder
  as_obj: CastBuilder
  as_lang: CastBuilder
  
  // Choice builders
  as_one: ChoiceBuilder
  as_maybe: ChoiceBuilder
  as_multi: ChoiceBuilder
  as_any: ChoiceBuilder

  constructor(parent: ChatfieldBuilder, name: string) {
    this.parent = parent
    this.name = name
    this._chatfieldField = {
      desc: name,  // Default to field name
      specs: {
        must: [],
        reject: [],
        hint: [],
        confidential: false,
        conclude: false
      },
      casts: {},
      value: null
    }
    // Add to parent's fields
    this.parent._chatfield.fields[name] = this._chatfieldField
    this.parent._currentField = name

    // Initialize cast builders
    this.as_int = this._createCastProxy('as_int', Number, 'Parse as integer')
    this.as_float = this._createCastProxy('as_float', Number, 'Parse as floating point number')
    this.as_bool = this._createCastProxy('as_bool', Boolean, 'Parse as boolean')
    this.as_str = this._createCastProxy('as_str', String, 'Format as string')
    this.as_percent = this._createCastProxy('as_percent', Number, 'Parse as percentage (0.0 to 1.0)')
    this.as_list = this._createCastProxy('as_list', Array, 'Parse as list/array')
    this.as_set = this._createCastProxy('as_set', Set, 'Parse as unique set')
    this.as_dict = this._createCastProxy('as_dict', Object, 'Parse as key-value dictionary')
    this.as_obj = this.as_dict  // Alias
    this.as_lang = this._createCastProxy('as_lang', String, 'Translate to {name}')

    // Choice builders
    this.as_one = this._createChoiceProxy('as_one', false, false)
    this.as_maybe = this._createChoiceProxy('as_maybe', true, false)
    this.as_multi = this._createChoiceProxy('as_multi', false, true)
    this.as_any = this._createChoiceProxy('as_any', true, true)
  }

  private _createCastProxy(baseName: string, primitiveType: any, basePrompt: string): CastBuilder {
    const builder = new CastBuilder(this, baseName, primitiveType, basePrompt)
    
    return new Proxy(builder, {
      get: (target, prop) => {
        if (prop === 'call' || prop === 'parent' || prop === 'baseName' || prop === 'primitiveType' || prop === 'basePrompt') {
          return target[prop as keyof CastBuilder]
        }
        
        // Make it callable directly
        if (prop === Symbol.for('nodejs.util.inspect.custom') || prop === 'then' || typeof prop === 'symbol') {
          return undefined
        }
        
        // Handle sub-attributes like as_lang.fr
        const propStr = String(prop)
        if (propStr.startsWith('_')) {
          throw new Error(`No attribute ${propStr}`)
        }
        
        const compoundName = `${baseName}_${propStr}`
        const compoundPrompt = basePrompt.includes('{name}') 
          ? basePrompt.replace('{name}', propStr)
          : `${basePrompt} for ${propStr}`
        
        return (prompt?: string) => {
          const castInfo = {
            type: typeof primitiveType === 'function' ? primitiveType.name.toLowerCase() : String(primitiveType),
            prompt: prompt || compoundPrompt
          }
          this._chatfieldField.casts[compoundName] = castInfo
          return this
        }
      },
      
      apply: (target, _thisArg, args) => {
        // Allow direct call like as_int()
        return target.call(args[0])
      }
    }) as any
  }

  private _createChoiceProxy(baseName: string, nullAllowed: boolean, multi: boolean): ChoiceBuilder {
    const builder = new ChoiceBuilder(this, baseName, nullAllowed, multi)
    
    return new Proxy(builder, {
      get: (target, prop) => {
        if (prop === 'parent' || prop === 'baseName' || prop === 'null' || prop === 'multi') {
          return target[prop as keyof ChoiceBuilder]
        }
        
        // Handle sub-attributes like as_one.parity
        const propStr = String(prop)
        if (propStr.startsWith('_')) {
          throw new Error(`No attribute ${propStr}`)
        }
        
        const compoundName = `${baseName}_${propStr}`
        
        return (...choices: string[]) => {
          const castInfo = {
            type: 'choice',
            prompt: `Choose for ${propStr}`,
            choices: choices,
            null: nullAllowed,
            multi: multi
          }
          this._chatfieldField.casts[compoundName] = castInfo
          return this
        }
      }
    }) as any
  }

  desc(description: string): FieldBuilder {
    // Set field description
    this._chatfieldField.desc = description
    return this
  }

  must(rule: string): FieldBuilder {
    // Add a validation requirement
    this._chatfieldField.specs.must.push(rule)
    return this
  }

  reject(rule: string): FieldBuilder {
    // Add a rejection rule
    this._chatfieldField.specs.reject.push(rule)
    return this
  }

  hint(tooltip: string): FieldBuilder {
    // Add helpful context
    if (!this._chatfieldField.specs.hint) {
      this._chatfieldField.specs.hint = []
    }
    this._chatfieldField.specs.hint.push(tooltip)
    return this
  }

  confidential(): FieldBuilder {
    // Mark field as confidential (tracked silently)
    this._chatfieldField.specs.confidential = true
    return this
  }

  conclude(): FieldBuilder {
    // Mark field for evaluation only after conversation ends (automatically confidential)
    this._chatfieldField.specs.conclude = true
    this._chatfieldField.specs.confidential = true  // Implied
    return this
  }

  field(name: string): FieldBuilder {
    // Start defining a new field
    return this.parent.field(name)
  }

  alice(): RoleBuilder {
    // Switch to alice configuration
    return this.parent.alice()
  }

  bob(): RoleBuilder {
    // Switch to bob configuration
    return this.parent.bob()
  }

  build(): Interview {
    // Build the final Interview
    return this.parent.build()
  }
}

/**
 * Main builder for creating Chatfield interviews.
 * Mirrors Python's ChatfieldBuilder
 */
export class ChatfieldBuilder {
  _chatfield: any
  _currentField: string | null
  _currentRole: string | null

  constructor() {
    this._chatfield = {
      type: '',
      desc: '',
      roles: {},
      fields: {}
    }
    this._currentField = null
    this._currentRole = null
  }

  type(name: string): ChatfieldBuilder {
    // Set the interview type name
    this._chatfield.type = name
    return this
  }

  desc(description: string): ChatfieldBuilder {
    // Set the interview description
    this._chatfield.desc = description
    return this
  }

  alice(): RoleBuilder {
    // Configure alice (interviewer) role
    return new RoleBuilder(this, 'alice')
  }

  bob(): RoleBuilder {
    // Configure bob (interviewee) role
    return new RoleBuilder(this, 'bob')
  }

  field(name: string): FieldBuilder {
    // Define a new field
    return new FieldBuilder(this, name)
  }

  build(): Interview {
    // Build the final Interview object
    // Create Interview instance with the built structure and override its _chatfield
    const interview = new Interview()
    interview._chatfield = JSON.parse(JSON.stringify(this._chatfield))  // Deep copy

    // Ensure roles are properly initialized with defaults
    if (!('alice' in interview._chatfield.roles)) {
      interview._chatfield.roles.alice = {
        type: 'Agent',
        traits: [],
        possible_traits: {}
      }
    }
    if (!('bob' in interview._chatfield.roles)) {
      interview._chatfield.roles.bob = {
        type: 'User',
        traits: [],
        possible_traits: {}
      }
    }

    // Ensure possible_traits dict exists for each role
    for (const role of Object.values(interview._chatfield.roles) as any[]) {
      if (!('possible_traits' in role)) {
        role.possible_traits = {}
      }
    }

    return interview
  }
}

/**
 * Create a new Chatfield builder.
 * Mirrors Python's chatfield()
 */
export function chatfield(): ChatfieldBuilder {
  return new ChatfieldBuilder()
}

/**
 * Preset builders for common patterns
 */

/**
 * Create a patient, thorough gatherer.
 * Mirrors Python's patient_gatherer()
 */
export function patientGatherer(): ChatfieldBuilder {
  const builder = chatfield()
    .alice()
  builder.trait.call("patient and thorough")
  builder.trait.call("asks follow-up questions when answers seem incomplete")
  builder.trait.call("provides helpful examples when users seem confused")
  return builder.parent
}

/**
 * Create a quick, efficient gatherer.
 * Mirrors Python's quick_gatherer()
 */
export function quickGatherer(): ChatfieldBuilder {
  const builder = chatfield()
    .alice()
  builder.trait.call("concise and efficient")
  builder.trait.call("accepts brief answers when they meet requirements")
  builder.trait.call("moves quickly through fields")
  return builder.parent
}

/**
 * Create an expert consultation gatherer.
 * Mirrors Python's expert_gatherer()
 */
export function expertGatherer(): ChatfieldBuilder {
  const builder = chatfield()
    .alice()
  builder.trait.call("assumes domain expertise")
  builder.trait.call("asks detailed technical questions")
  builder.trait.call("expects comprehensive, specific answers")
  return builder.parent
}
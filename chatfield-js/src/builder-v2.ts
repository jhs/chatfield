/**
 * Type-safe Builder API for creating Chatfield interviews.
 * Mirrors Python's builder.py with full TypeScript type tracking.
 */

import { Interview } from './interview'
import type {
  FieldMeta,
  FieldSpecs,
  InterviewMeta,
  RoleMeta,
  TraitBuilder,
  CastBuilder,
  ChoiceBuilder,
  CastInfo
} from './builder-types'

/**
 * Creates a callable TraitBuilder
 */
function createTraitBuilder(parent: RoleBuilder, role: string): TraitBuilder {
  const addTrait = (trait: string) => {
    parent._addTrait(role, trait)
    return parent
  }
  
  addTrait.possible = (name: string, trigger: string = "") => {
    parent._addPossibleTrait(role, name, trigger)
    return parent
  }
  
  return addTrait
}

/**
 * Creates a callable CastBuilder with dynamic sub-attributes
 */
function createCastBuilder<TParent extends FieldBuilder<any, any>>(
  parent: TParent,
  baseName: string,
  primitiveType: any,
  basePrompt: string
): CastBuilder<TParent> {
  const applyBaseCast = (prompt?: string) => {
    const castInfo: CastInfo = {
      type: typeof primitiveType === 'function' ? primitiveType.name.toLowerCase() : String(primitiveType),
      prompt: prompt || basePrompt
    }
    parent._chatfieldField.casts[baseName] = castInfo
    return parent
  }
  
  // Use Proxy to handle dynamic sub-attributes
  return new Proxy(applyBaseCast, {
    get(_target, prop: string) {
      if (prop === 'apply' || prop === 'call' || prop === 'bind') {
        return Reflect.get(applyBaseCast, prop)
      }
      
      // Return a function for sub-attributes like .fr, .even
      return (prompt?: string) => {
        const compoundName = `${baseName}_${prop}`
        const compoundPrompt = basePrompt.replace('{name}', String(prop))
        const castInfo: CastInfo = {
          type: typeof primitiveType === 'function' ? primitiveType.name.toLowerCase() : String(primitiveType),
          prompt: prompt || compoundPrompt
        }
        parent._chatfieldField.casts[compoundName] = castInfo
        return parent
      }
    }
  }) as CastBuilder<TParent>
}

/**
 * Creates a callable ChoiceBuilder with dynamic sub-attributes
 */
function createChoiceBuilder<TParent extends FieldBuilder<any, any>>(
  parent: TParent,
  baseName: string,
  nullAllowed: boolean,
  multi: boolean
): ChoiceBuilder<TParent> {
  const applyChoice = (...choices: string[]) => {
    const castInfo: CastInfo = {
      type: 'choice',
      prompt: `Choose ${multi ? 'one or more' : 'one'}`,
      choices: choices,
      null: nullAllowed,
      multi: multi
    }
    parent._chatfieldField.casts[baseName] = castInfo
    return parent
  }
  
  // Use Proxy to handle dynamic sub-attributes
  return new Proxy(applyChoice, {
    get(_target, prop: string) {
      if (prop === 'apply' || prop === 'call' || prop === 'bind') {
        return Reflect.get(applyChoice, prop)
      }
      
      // Return a function for sub-attributes
      return (...choices: string[]) => {
        const compoundName = `${baseName}_${prop}`
        const castInfo: CastInfo = {
          type: 'choice',
          prompt: `Choose for ${prop}`,
          choices: choices,
          null: nullAllowed,
          multi: multi
        }
        parent._chatfieldField.casts[compoundName] = castInfo
        return parent
      }
    }
  }) as ChoiceBuilder<TParent>
}

/**
 * Builder for alice/bob role configuration.
 * Mirrors Python's RoleBuilder
 */
export class RoleBuilder<Fields extends string = never> {
  parent: ChatfieldBuilder<Fields>
  role: string
  trait: TraitBuilder

  constructor(parent: ChatfieldBuilder<Fields>, role: string) {
    this.parent = parent
    this.role = role
    this._ensureRole()
    // Set context for subsequent calls
    this.parent._currentRole = role
    this.trait = createTraitBuilder(this, role)
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

  type(roleType: string): RoleBuilder<Fields> {
    // Set the role type
    this.parent._chatfield.roles[this.role].type = roleType
    return this
  }

  _addTrait(role: string, trait: string): void {
    // Add a regular trait
    const roleData = this.parent._chatfield.roles[role]
    if (roleData && !roleData.traits.includes(trait)) {
      roleData.traits.push(trait)
    }
  }

  _addPossibleTrait(role: string, name: string, trigger: string): void {
    // Add a possible trait
    const roleData = this.parent._chatfield.roles[role]
    if (roleData && roleData.possible_traits) {
      roleData.possible_traits[name] = {
        active: false,
        desc: trigger
      }
    }
  }

  field<Name extends string>(name: Name): FieldBuilder<Fields | Name, Name> {
    // Start defining a new field
    return this.parent.field(name)
  }

  alice(): RoleBuilder<Fields> {
    // Switch to alice configuration
    return this.parent.alice()
  }

  bob(): RoleBuilder<Fields> {
    // Switch to bob configuration
    return this.parent.bob()
  }

  build(): TypedInterview<Fields> {
    // Build the final Interview
    return this.parent.build()
  }
}

/**
 * Builder for field configuration with all decorators.
 * Tracks the field name in the type system.
 */
export class FieldBuilder<Fields extends string, CurrentField extends string> {
  parent: ChatfieldBuilder<Fields>
  fieldName: CurrentField
  _chatfieldField: FieldMeta

  // Cast builders
  as_int: CastBuilder<this>
  as_float: CastBuilder<this>
  as_bool: CastBuilder<this>
  as_percent: CastBuilder<this>
  as_lang: CastBuilder<this>
  as_one: ChoiceBuilder<this>
  as_maybe: ChoiceBuilder<this>
  as_multi: ChoiceBuilder<this>
  as_any: ChoiceBuilder<this>

  constructor(parent: ChatfieldBuilder<Fields>, fieldName: CurrentField) {
    this.parent = parent
    this.fieldName = fieldName
    
    // Ensure field exists
    const fieldKey = fieldName as unknown as Fields
    if (!(fieldKey in this.parent._chatfield.fields)) {
      (this.parent._chatfield.fields as any)[fieldKey] = {
        desc: '',
        specs: {
          must: [],
          reject: [],
          hint: []
        },
        casts: {},
        value: null
      }
    }
    
    this._chatfieldField = (this.parent._chatfield.fields as any)[fieldKey]
    
    // Set as current field
    this.parent._currentField = fieldName as string
    
    // Initialize cast builders
    this.as_int = createCastBuilder(this, 'as_int', Number, 'parse as integer')
    this.as_float = createCastBuilder(this, 'as_float', Number, 'parse as float')
    this.as_bool = createCastBuilder(this, 'as_bool', Boolean, 'parse as boolean')
    this.as_percent = createCastBuilder(this, 'as_percent', Number, 'parse as percentage (0-100)')
    this.as_lang = createCastBuilder(this, 'as_lang', String, 'translate to {name}')
    
    // Initialize choice builders
    this.as_one = createChoiceBuilder(this, 'as_one', false, false)
    this.as_maybe = createChoiceBuilder(this, 'as_maybe', true, false)
    this.as_multi = createChoiceBuilder(this, 'as_multi', false, true)
    this.as_any = createChoiceBuilder(this, 'as_any', true, true)
  }

  desc(description: string): this {
    // Set field description
    this._chatfieldField.desc = description
    return this
  }

  must(rule: string): this {
    // Add a validation requirement
    if (!this._chatfieldField.specs.must) {
      this._chatfieldField.specs.must = []
    }
    this._chatfieldField.specs.must.push(rule)
    return this
  }

  reject(rule: string): this {
    // Add a rejection rule
    if (!this._chatfieldField.specs.reject) {
      this._chatfieldField.specs.reject = []
    }
    this._chatfieldField.specs.reject.push(rule)
    return this
  }

  hint(tooltip: string): this {
    // Add helpful context
    if (!this._chatfieldField.specs.hint) {
      this._chatfieldField.specs.hint = []
    }
    this._chatfieldField.specs.hint.push(tooltip)
    return this
  }

  confidential(): this {
    // Mark field as confidential (tracked silently)
    this._chatfieldField.specs.confidential = true
    return this
  }

  conclude(): this {
    // Mark field for evaluation only after conversation ends (automatically confidential)
    this._chatfieldField.specs.conclude = true
    this._chatfieldField.specs.confidential = true  // Implied
    return this
  }

  field<Name extends string>(name: Name): FieldBuilder<Fields | Name, Name> {
    // Start defining a new field
    return this.parent.field(name)
  }

  alice(): RoleBuilder<Fields> {
    // Switch to alice configuration
    return this.parent.alice()
  }

  bob(): RoleBuilder<Fields> {
    // Switch to bob configuration
    return this.parent.bob()
  }

  build(): TypedInterview<Fields> {
    // Build the final Interview
    return this.parent.build()
  }
}

/**
 * Main builder for creating Chatfield interviews with type tracking.
 * The Fields generic tracks all field names added during building.
 */
export class ChatfieldBuilder<Fields extends string = never> {
  _chatfield: InterviewMeta<Fields>
  _currentField: string | null
  _currentRole: string | null

  constructor() {
    this._chatfield = {
      type: '',
      desc: '',
      roles: {
        alice: {
          type: null,
          traits: [],
          possible_traits: {}
        },
        bob: {
          type: null,
          traits: [],
          possible_traits: {}
        }
      },
      fields: {} as Record<Fields, FieldMeta>
    }
    this._currentField = null
    this._currentRole = null
  }

  type(name: string): ChatfieldBuilder<Fields> {
    // Set the interview type name
    this._chatfield.type = name
    return this
  }

  desc(description: string): ChatfieldBuilder<Fields> {
    // Set the interview description
    this._chatfield.desc = description
    return this
  }

  alice(): RoleBuilder<Fields> {
    // Configure alice (interviewer) role
    return new RoleBuilder(this, 'alice')
  }

  bob(): RoleBuilder<Fields> {
    // Configure bob (interviewee) role
    return new RoleBuilder(this, 'bob')
  }

  field<Name extends string>(name: Name): FieldBuilder<Fields | Name, Name> {
    // Start defining a new field, tracking its name in the type system
    return new FieldBuilder(this as any as ChatfieldBuilder<Fields | Name>, name)
  }

  build(): TypedInterview<Fields> {
    // Build the final Interview with known field names
    const interview = new Interview(
      this._chatfield.type,
      this._chatfield.desc,
      this._chatfield.roles,
      this._chatfield.fields
    )
    return interview as TypedInterview<Fields>
  }
}

/**
 * Type-safe Interview with known field names
 */
export type TypedInterview<Fields extends string> = Interview & {
  [K in Fields]: string  // Each field is accessible as a string property
}

/**
 * Main entry point - creates a new type-safe builder
 * @returns A new ChatfieldBuilder instance
 */
export function chatfield<Fields extends string = never>(): ChatfieldBuilder<Fields> {
  return new ChatfieldBuilder<Fields>()
}

/**
 * Loose type version for dynamic field names (Python-like experience)
 */
export function chatfieldDynamic(): ChatfieldBuilder<string> {
  return new ChatfieldBuilder<string>()
}
/**
 * Enhanced field builder with transformation decorators
 * Mimics Python's chatfield decorator pattern
 */

import { FieldMeta } from '../core/metadata'
import { GathererBuilder } from './gatherer-builder'

/**
 * Cast decorator builder for sub-attributes (e.g., as_lang.fr)
 */
export class CastBuilder {
  constructor(
    private parent: EnhancedFieldBuilder,
    private baseName: string,
    private primitiveType: string,
    private basePrompt: string
  ) {}

  // Direct call applies base cast
  apply(prompt?: string): EnhancedFieldBuilder {
    const castInfo = {
      type: this.primitiveType,
      prompt: prompt || this.basePrompt
    }
    this.parent.addCastInternal(this.baseName, castInfo)
    return this.parent
  }

  // Generic sub-cast creator (public for Proxy access)
  subCast(name: string) {
    return (prompt?: string) => {
      const compoundName = `${this.baseName}_${name}`
      const compoundPrompt = this.basePrompt.includes('{name}') 
        ? this.basePrompt.replace('{name}', name)
        : `${this.basePrompt} for ${name}`
      
      const castInfo = {
        type: this.primitiveType,
        prompt: prompt || compoundPrompt
      }
      this.parent.addCastInternal(compoundName, castInfo)
      return this.parent
    }
  }
  
  // Support dynamic property access
  [key: string]: any
}

/**
 * Choice builder for cardinality decorators (as_one, as_multi, etc.)
 */
export class ChoiceBuilder {
  constructor(
    private parent: EnhancedFieldBuilder,
    private baseName: string,
    private nullAllowed: boolean,
    private multiAllowed: boolean
  ) {}

  // Property access creates choice casts (e.g., as_one.priority)
  get selection() { return this.createChoice('selection') }
  get priority() { return this.createChoice('priority') }
  get skill() { return this.createChoice('skill') }
  get skills() { return this.createChoice('skills') }
  get component() { return this.createChoice('component') }
  get option() { return this.createChoice('option') }
  get color() { return this.createChoice('color') }
  get languages() { return this.createChoice('languages') }
  get reviewers() { return this.createChoice('reviewers') }
  
  private createChoice(name: string) {
    return (...choices: string[]) => {
      const compoundName = `${this.baseName}_${name}`
      const castInfo = {
        type: 'choice',
        prompt: `Choose for ${name}`,
        choices: choices,
        null: this.nullAllowed,
        multi: this.multiAllowed
      }
      this.parent.addCastInternal(compoundName, castInfo)
      return this.parent
    }
  }
  
  // Support dynamic property access
  [key: string]: any
}

/**
 * Enhanced field builder with Python-like transformation decorators
 */
export class EnhancedFieldBuilder {
  private fieldMeta: FieldMeta
  private parentBuilder: GathererBuilder

  // Cast decorators (with underscore to avoid collision with methods)
  private as_int_: CastBuilder
  private as_float_: CastBuilder
  private as_bool_base: CastBuilder
  private as_percent_: CastBuilder
  as_int: any   // For sub-attributes like as_int.neg1
  as_lang: any  // Keep this one as property for sub-attributes
  as_bool: any  // For sub-attributes like as_bool.even
  as_str: any   // For sub-attributes like as_str.uppercase
  
  // Choice cardinality decorators
  as_one: ChoiceBuilder
  as_maybe: ChoiceBuilder
  as_multi: ChoiceBuilder
  as_any: ChoiceBuilder

  constructor(fieldMeta: FieldMeta, parentBuilder: GathererBuilder) {
    this.fieldMeta = fieldMeta
    this.parentBuilder = parentBuilder
    
    // Initialize cast decorators
    this.as_int_ = new CastBuilder(this, 'as_int', 'int', 'parse as integer')
    this.as_float_ = new CastBuilder(this, 'as_float', 'float', 'parse as floating point number')
    this.as_bool_base = new CastBuilder(this, 'as_bool', 'bool', 'parse as boolean (true/false)')
    this.as_percent_ = new CastBuilder(this, 'as_percent', 'float', 'parse as percentage (0.0 to 1.0)')
    
    // Create CastBuilders for sub-attributes with Proxy support
    const langBuilder = new CastBuilder(this, 'as_lang', 'str', 'translate to {name}')
    const boolBuilder = new CastBuilder(this, 'as_bool', 'bool', 'parse as boolean for {name}')
    const strBuilder = new CastBuilder(this, 'as_str', 'str', 'parse as string {name}')
    const intBuilder = new CastBuilder(this, 'as_int', 'int', 'parse as integer for {name}')
    
    // Create a function that proxies both callable and property access
    const createProxiedCast = (builder: CastBuilder) => {
      const handler = {
        apply: (target: any, thisArg: any, args: any[]) => {
          return builder.apply(args[0])
        },
        get: (target: any, prop: string) => {
          if (prop in builder) {
            return (builder as any)[prop]
          }
          // Dynamic property access creates sub-casts
          return builder.subCast(prop)
        }
      }
      return new Proxy(() => {}, handler)
    }
    
    // Make as_int callable with dynamic sub-properties
    this.as_int = createProxiedCast(intBuilder)
    
    // Make as_lang callable with dynamic sub-properties
    this.as_lang = createProxiedCast(langBuilder)
    
    // Make as_bool callable with dynamic sub-properties
    this.as_bool = createProxiedCast(boolBuilder)
    
    // Make as_str callable with dynamic sub-properties
    this.as_str = createProxiedCast(strBuilder)
    
    // Initialize choice decorators
    this.as_one = new ChoiceBuilder(this, 'as_one', false, false)
    this.as_maybe = new ChoiceBuilder(this, 'as_maybe', true, false)
    this.as_multi = new ChoiceBuilder(this, 'as_multi', false, true)
    this.as_any = new ChoiceBuilder(this, 'as_any', true, true)
  }

  /**
   * Set field description
   */
  desc(description: string): EnhancedFieldBuilder {
    this.fieldMeta.setDescription(description)
    return this
  }

  /**
   * Add a validation requirement
   */
  must(rule: string): EnhancedFieldBuilder {
    this.fieldMeta.addMustRule(rule)
    return this
  }

  /**
   * Add a validation rejection rule
   */
  reject(rule: string): EnhancedFieldBuilder {
    this.fieldMeta.addRejectRule(rule)
    return this
  }

  /**
   * Add helpful context for users
   */
  hint(tooltip: string): EnhancedFieldBuilder {
    this.fieldMeta.setHint(tooltip)
    return this
  }

  /**
   * Mark field as confidential (not shown to user)
   */
  confidential(): EnhancedFieldBuilder {
    this.fieldMeta.setConfidential(true)
    return this
  }

  /**
   * Mark field as conclusion (gathered after main interview)
   */
  conclude(): EnhancedFieldBuilder {
    this.fieldMeta.setConclude(true)
    return this
  }

  /**
   * Set conditional visibility logic
   */
  when(condition: (data: Record<string, any>) => boolean): EnhancedFieldBuilder {
    this.fieldMeta.setWhenCondition(condition)
    return this
  }

  /**
   * Internal method to add cast information
   */
  addCastInternal(name: string, castInfo: any): void {
    this.fieldMeta.addCast(name, castInfo)
  }

  /**
   * Apply integer transformation directly
   */
  asInt(): EnhancedFieldBuilder {
    return this.as_int()
  }

  /**
   * Apply float transformation directly
   */
  asFloat(): EnhancedFieldBuilder {
    return this.as_float_.apply()
  }
  
  as_float(): EnhancedFieldBuilder {
    return this.as_float_.apply()
  }

  /**
   * Apply boolean transformation directly
   */
  asBool(): EnhancedFieldBuilder {
    return this.as_bool_base.apply()
  }

  /**
   * Apply percentage transformation directly
   */
  asPercent(): EnhancedFieldBuilder {
    return this.as_percent_.apply()
  }
  
  as_percent(): EnhancedFieldBuilder {
    return this.as_percent_.apply()
  }

  /**
   * Add another field
   */
  field(name: string): EnhancedFieldBuilder {
    return this.parentBuilder.field(name)
  }

  /**
   * Add user context
   */
  user(context: string): GathererBuilder {
    return this.parentBuilder.user(context)
  }

  /**
   * Add agent behavior context
   */
  agent(behavior: string): GathererBuilder {
    return this.parentBuilder.agent(behavior)
  }

  /**
   * Configure alice role
   */
  alice(): RoleBuilder {
    return this.parentBuilder.alice()
  }

  /**
   * Configure bob role
   */
  bob(): RoleBuilder {
    return this.parentBuilder.bob()
  }

  /**
   * Set docstring
   */
  docstring(doc: string): GathererBuilder {
    return this.parentBuilder.docstring(doc)
  }

  /**
   * Build the final gatherer
   */
  build(options?: any): any {
    return this.parentBuilder.build(options)
  }
}

/**
 * Trait builder for possible traits
 */
export class TraitBuilder {
  constructor(
    private parent: RoleBuilder,
    private role: string
  ) {}

  // Direct call adds regular trait
  apply(trait: string): RoleBuilder {
    this.parent.addTrait(this.role, trait)
    return this.parent
  }

  // possible() method for conditional traits
  possible(name: string, trigger: string = ""): RoleBuilder {
    this.parent.addPossibleTrait(this.role, name, trigger)
    return this.parent
  }
}

/**
 * Role builder for alice/bob configuration
 */
export class RoleBuilder {
  private traitBuilder: TraitBuilder

  constructor(
    private parentBuilder: GathererBuilder,
    private role: string
  ) {
    this.parentBuilder.setCurrentRole(role)
    this.traitBuilder = new TraitBuilder(this, role)
  }

  /**
   * Set role type (e.g., "Senior Developer", "Customer")
   */
  type(roleType: string): RoleBuilder {
    this.parentBuilder.setRoleType(this.role, roleType)
    return this
  }

  /**
   * Add a trait (makes the builder itself callable for trait)
   */
  trait(traitName: string): RoleBuilder {
    this.addTrait(this.role, traitName)
    return this
  }

  /**
   * Add a trait directly (alternative to trait.apply)
   */
  addTrait(role: string, trait: string): void {
    this.parentBuilder.addRoleTrait(role, trait)
  }

  /**
   * Add a possible trait
   */
  addPossibleTrait(role: string, name: string, trigger: string): void {
    this.parentBuilder.addRolePossibleTrait(role, name, trigger)
  }

  /**
   * Start defining a new field
   */
  field(name: string): EnhancedFieldBuilder {
    return this.parentBuilder.field(name)
  }

  /**
   * Switch to alice configuration
   */
  alice(): RoleBuilder {
    return this.parentBuilder.alice()
  }

  /**
   * Switch to bob configuration
   */
  bob(): RoleBuilder {
    return this.parentBuilder.bob()
  }

  /**
   * Build the final gatherer
   */
  build(options?: any): any {
    return this.parentBuilder.build(options)
  }
}
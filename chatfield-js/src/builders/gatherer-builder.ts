/**
 * Fluent builder API for creating gatherers
 */

import { GathererMeta, FieldMeta } from '../core/metadata'
import { Gatherer } from '../core/gatherer'
import { Interview, FieldProxy } from '../core/interview'
import { GathererOptions } from '../core/types'
import { EnhancedFieldBuilder, RoleBuilder } from './field-builder'

// Re-export RoleBuilder from field-builder
export { RoleBuilder } from './field-builder'

/**
 * Field builder for configuring individual fields
 */
export class FieldBuilder {
  private fieldMeta: FieldMeta
  private parentBuilder: GathererBuilder

  constructor(fieldMeta: FieldMeta, parentBuilder: GathererBuilder) {
    this.fieldMeta = fieldMeta
    this.parentBuilder = parentBuilder
  }

  /**
   * Add a validation requirement
   */
  must(rule: string): FieldBuilder {
    this.fieldMeta.addMustRule(rule)
    return this
  }

  /**
   * Add a validation rejection rule
   */
  reject(rule: string): FieldBuilder {
    this.fieldMeta.addRejectRule(rule)
    return this
  }

  /**
   * Add helpful context for users
   */
  hint(tooltip: string): FieldBuilder {
    this.fieldMeta.setHint(tooltip)
    return this
  }

  /**
   * Set conditional visibility logic
   */
  when(condition: (data: Record<string, string>) => boolean): FieldBuilder {
    this.fieldMeta.setWhenCondition(condition)
    return this
  }

  /**
   * Add another field
   */
  field(name: string, description: string = ''): EnhancedFieldBuilder {
    return this.parentBuilder.field(name, description)
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
   * Set docstring
   */
  docstring(doc: string): GathererBuilder {
    return this.parentBuilder.docstring(doc)
  }

  /**
   * Build the final Interview
   */
  build(options?: GathererOptions): Interview {
    return this.parentBuilder.build(options)
  }
}

/**
 * Main builder for creating gatherers with fluent API
 */
export class GathererBuilder {
  private meta: GathererMeta
  private currentRole: string | null = null

  constructor() {
    this.meta = new GathererMeta()
  }

  /**
   * Set the interview type
   */
  type(typeName: string): GathererBuilder {
    this.meta.setType(typeName)
    return this
  }

  /**
   * Add a field (with optional description)
   */
  field(name: string, description: string = ''): EnhancedFieldBuilder {
    const fieldMeta = this.meta.addField(name, description)
    return new EnhancedFieldBuilder(fieldMeta, this)
  }

  /**
   * Configure alice role
   */
  alice(): RoleBuilder {
    return new RoleBuilder(this, 'alice')
  }

  /**
   * Configure bob role
   */
  bob(): RoleBuilder {
    return new RoleBuilder(this, 'bob')
  }

  /**
   * Add user context information
   */
  user(context: string): GathererBuilder {
    this.meta.addUserContext(context)
    return this
  }

  /**
   * Add agent behavior context
   */
  agent(behavior: string): GathererBuilder {
    this.meta.addAgentContext(behavior)
    return this
  }

  /**
   * Set description (alias for docstring)
   */
  desc(description: string): GathererBuilder {
    return this.docstring(description)
  }

  /**
   * Set the main description/docstring
   */
  docstring(doc: string): GathererBuilder {
    this.meta.setDocstring(doc)
    return this
  }

  /**
   * Build the final Interview instance
   */
  build(options?: GathererOptions): Interview {
    // Create an Interview instance with the builder's metadata (skip field discovery)
    const interview = new Interview(true)
    
    // Set the type and description
    interview._chatfield.type = this.meta.type || ''
    interview._chatfield.desc = this.meta.docstring || ''
    
    // Set roles
    const roles = this.meta.getRoles()
    const aliceRole = roles.get('alice')
    if (aliceRole) {
      interview._chatfield.roles.alice = {
        type: aliceRole.type || undefined,
        traits: aliceRole.traits || []
      }
    }
    const bobRole = roles.get('bob')
    if (bobRole) {
      interview._chatfield.roles.bob = {
        type: bobRole.type || undefined,
        traits: bobRole.traits || []
      }
    }
    
    // Set fields with all casts
    this.meta.getFields().forEach(field => {
      // Convert casts Map to object
      const castsObj: Record<string, any> = {}
      field.casts.forEach((value, key) => {
        castsObj[key] = value
      })
      
      interview._chatfield.fields[field.name] = {
        desc: field.description,
        specs: {
          must: field.mustRules || [],
          reject: field.rejectRules || [],
          hint: field.hint ? [field.hint] : [],
          confidential: field.confidential,
          conclude: field.conclude
        },
        casts: castsObj,
        value: null
      }
    })
    
    // Return a Proxy to enable field access like interview.field_name
    return new Proxy(interview, {
      get(target, prop, receiver) {
        // If it's a known property or method, return it
        if (prop in target || typeof prop === 'symbol') {
          return Reflect.get(target, prop, receiver)
        }
        
        // If it's a field name, return the field value or null
        const propStr = String(prop)
        if (target._chatfield.fields[propStr]) {
          const field = target._chatfield.fields[propStr]
          if (field.value) {
            // Create a FieldProxy with dynamic property access
            const fieldProxy = new FieldProxy(field.value.value, field)
            
            // Return a Proxy around FieldProxy to handle dynamic properties
            return new Proxy(fieldProxy, {
              get(fpTarget, fpProp) {
                // Check if it's a known property/method on FieldProxy
                if (fpProp in fpTarget) {
                  return Reflect.get(fpTarget, fpProp)
                }
                
                // Otherwise, check if it's a dynamic transformation like as_lang_fr
                const propName = String(fpProp)
                if (field.value && field.value[propName] !== undefined) {
                  return field.value[propName]
                }
                
                return undefined
              }
            })
          }
          return null
        }
        
        // Otherwise return undefined
        return undefined
      }
    }) as Interview
  }

  /**
   * Get the metadata (for inspection/debugging)
   */
  getMeta(): GathererMeta {
    return this.meta.clone()
  }

  // Internal methods for role configuration
  setCurrentRole(role: string): void {
    this.currentRole = role
  }

  setRoleType(role: string, roleType: string): void {
    this.meta.setRoleType(role, roleType)
  }

  addRoleTrait(role: string, trait: string): void {
    this.meta.addRoleTrait(role, trait)
  }

  addRolePossibleTrait(role: string, name: string, trigger: string): void {
    this.meta.addRolePossibleTrait(role, name, trigger)
  }
}

/**
 * Create a new gatherer builder
 */
export function chatfield(): GathererBuilder {
  return new GathererBuilder()
}

/**
 * Convenience function to create a simple Interview with multiple fields
 */
export function simpleGatherer(fields: Record<string, string>, options?: {
  userContext?: string[]
  agentContext?: string[]
  docstring?: string
}): Interview {
  const builder = chatfield()

  // Add docstring
  if (options?.docstring) {
    builder.docstring(options.docstring)
  }

  // Add user context
  if (options?.userContext) {
    options.userContext.forEach(context => builder.user(context))
  }

  // Add agent context
  if (options?.agentContext) {
    options.agentContext.forEach(behavior => builder.agent(behavior))
  }

  // Add fields
  let currentBuilder: EnhancedFieldBuilder | GathererBuilder = builder
  const fieldEntries = Object.entries(fields)
  
  for (let i = 0; i < fieldEntries.length; i++) {
    const entry = fieldEntries[i]
    if (entry) {
      const [name, description] = entry
      currentBuilder = currentBuilder.field(name, description)
    }
  }

  return currentBuilder.build()
}

/**
 * Quick preset for patient data gathering
 */
export function patientGatherer(): GathererBuilder {
  return chatfield()
    .agent('Be patient and thorough')
    .agent('Ask follow-up questions when answers seem incomplete')
    .agent('Provide helpful examples when users seem confused')
}

/**
 * Quick preset for rapid data gathering
 */
export function quickGatherer(): GathererBuilder {
  return chatfield()
    .agent('Be concise and efficient')
    .agent('Accept brief answers when they meet requirements')
    .agent('Move quickly through fields')
}

/**
 * Quick preset for expert consultation
 */
export function expertGatherer(): GathererBuilder {
  return chatfield()
    .agent('Assume the user has domain expertise')
    .agent('Ask detailed technical questions')
    .agent('Expect comprehensive, specific answers')
}
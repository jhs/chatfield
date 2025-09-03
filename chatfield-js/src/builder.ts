/**
 * Unified builder API for creating Interview instances
 * Mirrors Python's builder.py
 */

import { InterviewMeta, FieldMeta } from './interview'
import { Interview } from './interview'
import { InterviewOptions, InterviewSchema } from './types'

/**
 * Field builder for configuring individual fields
 */
export class FieldBuilder {
  private fieldMeta: FieldMeta
  private parentBuilder: InterviewBuilder

  constructor(fieldMeta: FieldMeta, parentBuilder: InterviewBuilder) {
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
   * Add another field
   */
  field(name: string, description: string): FieldBuilder {
    return this.parentBuilder.field(name, description)
  }

  /**
   * Add alice role context
   */
  alice(roleType: string): InterviewBuilder {
    return this.parentBuilder.alice(roleType)
  }

  /**
   * Add bob role context
   */
  bob(roleType: string): InterviewBuilder {
    return this.parentBuilder.bob(roleType)
  }

  /**
   * Set docstring
   */
  docstring(doc: string): InterviewBuilder {
    return this.parentBuilder.docstring(doc)
  }

  /**
   * Build the final Interview
   */
  build(options?: InterviewOptions): Interview {
    return this.parentBuilder.build(options)
  }
}

/**
 * Main builder for creating Interview instances with fluent API
 * Mirrors Python's ChatfieldBuilder
 */
export class InterviewBuilder {
  private meta: InterviewMeta

  constructor() {
    this.meta = new InterviewMeta()
  }

  /**
   * Add a field to the Interview
   */
  field(name: string, description: string): FieldBuilder {
    const fieldMeta = this.meta.addField(name, description)
    return new FieldBuilder(fieldMeta, this)
  }

  /**
   * Add alice role information (assistant)
   */
  alice(roleType: string): InterviewBuilder {
    this.meta.addAgentContext(roleType)
    return this
  }

  /**
   * Add bob role information (user)
   */
  bob(roleType: string): InterviewBuilder {
    this.meta.addUserContext(roleType)
    return this
  }

  /**
   * Set the docstring
   */
  docstring(doc: string): InterviewBuilder {
    this.meta.setDocstring(doc)
    return this
  }

  /**
   * Build the final Interview instance
   */
  build(options?: InterviewOptions): Interview {
    return new Interview(this.meta, options)
  }
}

/**
 * Main entry point for the builder API - mirrors Python's chatfield() function
 */
export function chatfield(): InterviewBuilder {
  return new InterviewBuilder()
}

/**
 * Create an Interview from a schema configuration
 */
export function createInterview(schema: InterviewSchema, options?: InterviewOptions): Interview {
  const meta = new InterviewMeta()

  // Set docstring
  if (schema.docstring) {
    meta.setDocstring(schema.docstring)
  }

  // Add alice context (was agent)
  if (schema.agentContext) {
    schema.agentContext.forEach(context => meta.addAgentContext(context))
  }

  // Add bob context (was user)
  if (schema.userContext) {
    schema.userContext.forEach(context => meta.addUserContext(context))
  }

  // Add fields
  Object.entries(schema.fields).forEach(([name, fieldConfig]) => {
    const fieldMeta = meta.addField(name, fieldConfig.description)

    // Add validation rules
    if (fieldConfig.must) {
      fieldConfig.must.forEach(rule => fieldMeta.addMustRule(rule))
    }

    if (fieldConfig.reject) {
      fieldConfig.reject.forEach(rule => fieldMeta.addRejectRule(rule))
    }

    // Add hint
    if (fieldConfig.hint) {
      fieldMeta.setHint(fieldConfig.hint)
    }

  })

  return new Interview(meta, options)
}
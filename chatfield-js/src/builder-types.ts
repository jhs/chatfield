/**
 * Type definitions for the type-safe builder API
 */

/**
 * Field specification with all validation rules
 */
export interface FieldSpecs {
  must?: string[]
  reject?: string[]
  hint?: string[]
  confidential?: boolean
  conclude?: boolean
}

/**
 * Cast information for field transformations
 */
export interface CastInfo {
  type: string
  prompt: string
  choices?: string[]
  null?: boolean
  multi?: boolean
}

/**
 * Field metadata structure
 */
export interface FieldMeta {
  desc: string
  specs: FieldSpecs
  casts: Record<string, CastInfo>
  value: null | {
    value: string
    context?: string
    as_quote?: string
    [key: string]: any  // For transformations
  }
}

/**
 * Role configuration
 */
export interface RoleMeta {
  type: string | null
  traits: string[]
  possible_traits: Record<string, {
    active: boolean
    desc: string
  }>
}

/**
 * Complete interview metadata
 */
export interface InterviewMeta<Fields extends string = string> {
  type: string
  desc: string
  roles: {
    alice: RoleMeta
    bob: RoleMeta
    [key: string]: RoleMeta
  }
  fields: Record<Fields, FieldMeta>
}

/**
 * Callable trait builder interface
 */
export interface TraitBuilder {
  (trait: string): any  // Returns RoleBuilder but avoiding circular dependency
  possible(name: string, trigger?: string): any
}

/**
 * Callable cast builder interface
 */
export interface CastBuilder<TParent> {
  (prompt?: string): TParent  // Direct call for base cast
  [subAttribute: string]: (prompt?: string) => TParent  // Sub-attributes like .fr, .even
}

/**
 * Callable choice builder interface
 */
export interface ChoiceBuilder<TParent> {
  (...choices: string[]): TParent  // Direct call with choices
  [subAttribute: string]: (...choices: string[]) => TParent  // Sub-attributes
}
import { markRaw } from 'vue'
import type { Component } from 'vue'
import {
  ArrowLeftRight, Filter, Type, RefreshCw, BarChart2, Maximize2,
  Combine, ArrowDown, ListOrdered, Search, Shield, Trash2, Code2,
} from 'lucide-vue-next'
import type { TransformNodeType } from '@/types'

import FieldMappingInspector from '@/components/workflow/inspector/transforms/FieldMappingInspector.vue'
import FilterInspector from '@/components/workflow/inspector/transforms/FilterInspector.vue'
import JoinInspector from '@/components/workflow/inspector/transforms/JoinInspector.vue'
import MergeInspector from '@/components/workflow/inspector/transforms/MergeInspector.vue'
import UnionInspector from '@/components/workflow/inspector/transforms/UnionInspector.vue'
import ConvertInspector from '@/components/workflow/inspector/transforms/ConvertInspector.vue'
import DeriveInspector from '@/components/workflow/inspector/transforms/DeriveInspector.vue'
import AggregateInspector from '@/components/workflow/inspector/transforms/AggregateInspector.vue'
import FlattenInspector from '@/components/workflow/inspector/transforms/FlattenInspector.vue'
import LookupInspector from '@/components/workflow/inspector/transforms/LookupInspector.vue'
import ValidateInspector from '@/components/workflow/inspector/transforms/ValidateInspector.vue'
import CleanseInspector from '@/components/workflow/inspector/transforms/CleanseInspector.vue'
import CodeInspector from '@/components/workflow/inspector/transforms/CodeInspector.vue'

export interface TransformDefinition {
  type: TransformNodeType
  label: string
  description: string
  icon: Component
  accentColor: string
  paletteGroup: 'shape' | 'combine' | 'quality' | 'code'
  inputCount: 1 | 2
  inspectorComponent: Component
}

export const TRANSFORM_REGISTRY: Record<TransformNodeType, TransformDefinition> = {
  'transform.map': {
    type: 'transform.map',
    label: 'Map Fields',
    description: 'Remap and rename fields',
    icon: markRaw(ArrowLeftRight),
    accentColor: '#f59e0b',
    paletteGroup: 'shape',
    inputCount: 1,
    inspectorComponent: markRaw(FieldMappingInspector),
  },
  'transform.filter': {
    type: 'transform.filter',
    label: 'Filter',
    description: 'Remove rows by condition',
    icon: markRaw(Filter),
    accentColor: '#ef4444',
    paletteGroup: 'shape',
    inputCount: 1,
    inspectorComponent: markRaw(FilterInspector),
  },
  'transform.derive': {
    type: 'transform.derive',
    label: 'Derive',
    description: 'Compute new fields from formulas',
    icon: markRaw(Type),
    accentColor: '#f97316',
    paletteGroup: 'shape',
    inputCount: 1,
    inspectorComponent: markRaw(DeriveInspector),
  },
  'transform.convert': {
    type: 'transform.convert',
    label: 'Convert',
    description: 'Cast fields to new data types',
    icon: markRaw(RefreshCw),
    accentColor: '#10b981',
    paletteGroup: 'shape',
    inputCount: 1,
    inspectorComponent: markRaw(ConvertInspector),
  },
  'transform.aggregate': {
    type: 'transform.aggregate',
    label: 'Aggregate',
    description: 'Group and summarize records',
    icon: markRaw(BarChart2),
    accentColor: '#06b6d4',
    paletteGroup: 'shape',
    inputCount: 1,
    inspectorComponent: markRaw(AggregateInspector),
  },
  'transform.flatten': {
    type: 'transform.flatten',
    label: 'Flatten JSON',
    description: 'Expand nested JSON paths',
    icon: markRaw(Maximize2),
    accentColor: '#0ea5e9',
    paletteGroup: 'shape',
    inputCount: 1,
    inspectorComponent: markRaw(FlattenInspector),
  },
  'transform.join': {
    type: 'transform.join',
    label: 'Join',
    description: 'Combine two datasets on a key',
    icon: markRaw(Combine),
    accentColor: '#8b5cf6',
    paletteGroup: 'combine',
    inputCount: 2,
    inspectorComponent: markRaw(JoinInspector),
  },
  'transform.union': {
    type: 'transform.union',
    label: 'Union',
    description: 'Stack datasets vertically',
    icon: markRaw(ArrowDown),
    accentColor: '#14b8a6',
    paletteGroup: 'combine',
    inputCount: 2,
    inspectorComponent: markRaw(UnionInspector),
  },
  'transform.merge': {
    type: 'transform.merge',
    label: 'Merge',
    description: 'Diff and upsert by match key',
    icon: markRaw(ListOrdered),
    accentColor: '#a16207',
    paletteGroup: 'combine',
    inputCount: 2,
    inspectorComponent: markRaw(MergeInspector),
  },
  'transform.lookup': {
    type: 'transform.lookup',
    label: 'Lookup',
    description: 'Enrich records from a reference',
    icon: markRaw(Search),
    accentColor: '#6366f1',
    paletteGroup: 'quality',
    inputCount: 1,
    inspectorComponent: markRaw(LookupInspector),
  },
  'transform.validate': {
    type: 'transform.validate',
    label: 'Validate',
    description: 'Flag or reject invalid records',
    icon: markRaw(Shield),
    accentColor: '#84cc16',
    paletteGroup: 'quality',
    inputCount: 1,
    inspectorComponent: markRaw(ValidateInspector),
  },
  'transform.cleanse': {
    type: 'transform.cleanse',
    label: 'Cleanse',
    description: 'Standardize and normalize values',
    icon: markRaw(Trash2),
    accentColor: '#ec4899',
    paletteGroup: 'quality',
    inputCount: 1,
    inspectorComponent: markRaw(CleanseInspector),
  },
  'transform.code': {
    type: 'transform.code',
    label: 'Code Step',
    description: 'Run custom JavaScript on records',
    icon: markRaw(Code2),
    accentColor: '#64748b',
    paletteGroup: 'code',
    inputCount: 1,
    inspectorComponent: markRaw(CodeInspector),
  },
}

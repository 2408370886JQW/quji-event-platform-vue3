// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, defineComponent, h, inject, provide, type Ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import RegisterView from './RegisterView.vue'

vi.mock('vue-router', () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}))
vi.mock('element-plus', () => ({
  ElMessage: { success: vi.fn(), warning: vi.fn() },
}))

const radioGroupKey = Symbol('radio-group')
const FormStub = defineComponent({
  inheritAttrs: false,
  setup(_, { attrs, slots, expose }) {
    expose({ validate: () => Promise.resolve(true) })
    return () =>
      h(
        'form',
        {
          onSubmit: (event: Event) => {
            event.preventDefault()
            const handler = attrs.onSubmit as ((event: Event) => void) | undefined
            handler?.(event)
          },
        },
        slots.default?.(),
      )
  },
})
const FormItemStub = defineComponent({
  setup(_, { slots }) {
    return () => h('label', slots.default?.())
  },
})
const InputStub = defineComponent({
  inheritAttrs: false,
  props: { modelValue: { type: String, default: '' } },
  emits: ['update:modelValue'],
  setup(props, { attrs, emit }) {
    return () => {
      const inputAttrs = { ...attrs }
      delete inputAttrs.size
      delete inputAttrs.showPassword
      delete inputAttrs['show-password']
      return h('input', {
        ...inputAttrs,
        value: props.modelValue,
        onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLInputElement).value),
      })
    }
  },
})
const ButtonStub = defineComponent({
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h(
        'button',
        {
          ...attrs,
          type: String(attrs.nativeType || attrs['native-type'] || 'button'),
        },
        slots.default?.(),
      )
  },
})
const RadioGroupStub = defineComponent({
  props: { modelValue: { type: String, default: '' } },
  setup(props, { slots }) {
    provide(
      radioGroupKey,
      computed(() => props.modelValue),
    )
    return () => h('div', slots.default?.())
  },
})
const RadioStub = defineComponent({
  props: { value: { type: String, required: true } },
  setup(props, { slots }) {
    const selected = inject<Ref<string>>(radioGroupKey)
    return () =>
      h('label', [
        h('input', { type: 'radio', value: props.value, checked: selected?.value === props.value }),
        slots.default?.(),
      ])
  },
})

function mountRegister() {
  return mount(RegisterView, {
    global: {
      plugins: [createPinia()],
      stubs: {
        RouterLink: { template: '<a><slot /></a>' },
        ElForm: FormStub,
        ElFormItem: FormItemStub,
        ElInput: InputStub,
        ElButton: ButtonStub,
        ElSteps: { template: '<div><slot /></div>' },
        ElStep: true,
        ElCheckbox: true,
        ElRadioGroup: RadioGroupStub,
        ElRadio: RadioStub,
      },
    },
  })
}

describe('首次入驻注册', () => {
  beforeEach(() => {
    const values = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      clear: () => values.clear(),
      getItem: (key: string) => values.get(key) || null,
      removeItem: (key: string) => values.delete(key),
      setItem: (key: string, value: string) => values.set(key, value),
    })
  })

  it('手机号验证后必须先选择办理身份，未选择前不显示实名表单', async () => {
    const wrapper = mountRegister()

    await wrapper.get('input[placeholder="请输入常用手机号"]').setValue('13800138000')
    await wrapper.get('input[placeholder="请输入验证码"]').setValue('246810')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('先确认您的办理身份')
    expect(wrapper.text()).toContain('我是法定代表人')
    expect(wrapper.text()).toContain('我是被授权经办人')
    expect(wrapper.find('input[placeholder="请输入本人真实姓名"]').exists()).toBe(false)
    expect((wrapper.find('input[value="legal_representative"]').element as HTMLInputElement).checked).toBe(
      false,
    )
    expect((wrapper.find('input[value="authorized_agent"]').element as HTMLInputElement).checked).toBe(false)
  })
})

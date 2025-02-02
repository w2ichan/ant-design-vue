import PropTypes from '../_util/vue-types';
import { Provider, create } from '../_util/store';
import { default as SubPopupMenu, getActiveKey } from './SubPopupMenu';
import BaseMixin from '../_util/BaseMixin';
import hasProp, { getOptionProps, getComponent, filterEmpty } from '../_util/props-util';
import commonPropsType from './commonPropsType';
import { defineComponent, provide } from 'vue';

const Menu = {
  name: 'Menu',
  inheritAttrs: false,
  props: {
    ...commonPropsType,
    onClick: PropTypes.func,
    selectable: PropTypes.looseBool.def(true),
  },
  mixins: [BaseMixin],
  data() {
    const props = getOptionProps(this);
    let selectedKeys = props.defaultSelectedKeys;
    let openKeys = props.defaultOpenKeys;
    if ('selectedKeys' in props) {
      selectedKeys = props.selectedKeys || [];
    }
    if ('openKeys' in props) {
      openKeys = props.openKeys || [];
    }

    this.store = create({
      selectedKeys,
      openKeys,
      activeKey: {
        '0-menu-': getActiveKey({ ...props, children: props.children || [] }, props.activeKey),
      },
    });

    // this.isRootMenu = true // 声明在props上
    return {};
  },
  created() {
    provide('parentMenu', this);
  },
  mounted() {
    this.updateMiniStore();
  },
  updated() {
    this.updateMiniStore();
  },
  methods: {
    handleSelect(selectInfo) {
      const props = this.$props;
      if (props.selectable) {
        // root menu
        let selectedKeys = this.store.getState().selectedKeys;
        const selectedKey = selectInfo.key;
        if (props.multiple) {
          selectedKeys = selectedKeys.concat([selectedKey]);
        } else {
          selectedKeys = [selectedKey];
        }
        if (!hasProp(this, 'selectedKeys')) {
          this.store.setState({
            selectedKeys,
          });
        }
        this.__emit('select', {
          ...selectInfo,
          selectedKeys,
        });
      }
    },

    handleClick(e) {
      this.__emit('click', e);
    },
    // onKeyDown needs to be exposed as a instance method
    // e.g., in rc-select, we need to navigate menu item while
    // current active item is rc-select input box rather than the menu itself
    onKeyDown(e, callback) {
      this.innerMenu.getWrappedInstance().onKeyDown(e, callback);
    },
    onOpenChange(event) {
      const openKeys = this.store.getState().openKeys.concat();
      let changed = false;
      const processSingle = e => {
        let oneChanged = false;
        if (e.open) {
          oneChanged = openKeys.indexOf(e.key) === -1;
          if (oneChanged) {
            openKeys.push(e.key);
          }
        } else {
          const index = openKeys.indexOf(e.key);
          oneChanged = index !== -1;
          if (oneChanged) {
            openKeys.splice(index, 1);
          }
        }
        changed = changed || oneChanged;
      };
      if (Array.isArray(event)) {
        // batch change call
        event.forEach(processSingle);
      } else {
        processSingle(event);
      }
      if (changed) {
        if (!hasProp(this, 'openKeys')) {
          this.store.setState({ openKeys });
        }
        this.__emit('openChange', openKeys);
      }
    },

    handleDeselect(selectInfo) {
      const props = this.$props;
      if (props.selectable) {
        const selectedKeys = this.store.getState().selectedKeys.concat();
        const selectedKey = selectInfo.key;
        const index = selectedKeys.indexOf(selectedKey);
        if (index !== -1) {
          selectedKeys.splice(index, 1);
        }
        if (!hasProp(this, 'selectedKeys')) {
          this.store.setState({
            selectedKeys,
          });
        }
        this.__emit('deselect', {
          ...selectInfo,
          selectedKeys,
        });
      }
    },

    getOpenTransitionName() {
      const props = this.$props;
      let transitionName = props.openTransitionName;
      const animationName = props.openAnimation;
      if (!transitionName && typeof animationName === 'string') {
        transitionName = `${props.prefixCls}-open-${animationName}`;
      }
      return transitionName;
    },
    updateMiniStore() {
      const props = getOptionProps(this);
      if ('selectedKeys' in props) {
        this.store.setState({
          selectedKeys: props.selectedKeys || [],
        });
      }
      if ('openKeys' in props) {
        this.store.setState({
          openKeys: props.openKeys || [],
        });
      }
    },
    saveInnerMenu(ref) {
      this.innerMenu = ref;
    },
  },

  render() {
    const props = { ...getOptionProps(this), ...this.$attrs };
    props.class = props.class
      ? `${props.class} ${props.prefixCls}-root`
      : `${props.prefixCls}-root`;
    const subPopupMenuProps = {
      ...props,
      itemIcon: getComponent(this, 'itemIcon', props),
      expandIcon: getComponent(this, 'expandIcon', props),
      overflowedIndicator: getComponent(this, 'overflowedIndicator', props) || <span>···</span>,
      openTransitionName: this.getOpenTransitionName(),
      children: filterEmpty(props.children),
      onClick: this.handleClick,
      onOpenChange: this.onOpenChange,
      onDeselect: this.handleDeselect,
      onSelect: this.handleSelect,
      ref: this.saveInnerMenu,
    };

    const subPopupMenu = <SubPopupMenu {...subPopupMenuProps} />;
    return <Provider store={this.store}>{subPopupMenu}</Provider>;
  },
};

export default defineComponent(Menu);

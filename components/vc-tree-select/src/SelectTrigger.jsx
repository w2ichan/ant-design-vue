import PropTypes from '../../_util/vue-types';
import Trigger from '../../vc-trigger';
import { createRef } from './util';
import classNames from '../../_util/classNames';
import { getSlot } from '../../_util/props-util';

const BUILT_IN_PLACEMENTS = {
  bottomLeft: {
    points: ['tl', 'bl'],
    offset: [0, 4],
    overflow: {
      adjustX: 0,
      adjustY: 1,
    },
    ignoreShake: true,
  },
  topLeft: {
    points: ['bl', 'tl'],
    offset: [0, -4],
    overflow: {
      adjustX: 0,
      adjustY: 1,
    },
    ignoreShake: true,
  },
};

const SelectTrigger = {
  name: 'SelectTrigger',
  inheritAttrs: false,
  props: {
    // Pass by outside user props
    disabled: PropTypes.looseBool,
    showSearch: PropTypes.looseBool,
    prefixCls: PropTypes.string,
    dropdownPopupAlign: PropTypes.object,
    dropdownClassName: PropTypes.string,
    dropdownStyle: PropTypes.object,
    transitionName: PropTypes.string,
    animation: PropTypes.string,
    getPopupContainer: PropTypes.func,

    dropdownMatchSelectWidth: PropTypes.looseBool,

    // Pass by Select
    isMultiple: PropTypes.looseBool,
    dropdownPrefixCls: PropTypes.string,
    dropdownVisibleChange: PropTypes.func,
    popupElement: PropTypes.node,
    open: PropTypes.looseBool,
  },
  created() {
    this.triggerRef = createRef();
  },
  methods: {
    getDropdownTransitionName() {
      const { transitionName, animation, dropdownPrefixCls } = this.$props;
      if (!transitionName && animation) {
        return `${dropdownPrefixCls}-${animation}`;
      }
      return transitionName;
    },

    forcePopupAlign() {
      const $trigger = this.triggerRef.current;
      if ($trigger) {
        $trigger.forcePopupAlign();
      }
    },
  },

  render() {
    const {
      disabled,
      isMultiple,
      dropdownPopupAlign,
      dropdownMatchSelectWidth,
      dropdownClassName,
      dropdownStyle,
      dropdownVisibleChange,
      getPopupContainer,
      dropdownPrefixCls,
      popupElement,
      open,
    } = this.$props;

    // TODO: [Legacy] Use new action when trigger fixed: https://github.com/react-component/trigger/pull/86

    // When false do nothing with the width
    // ref: https://github.com/ant-design/ant-design/issues/10927
    let stretch;
    if (dropdownMatchSelectWidth !== false) {
      stretch = dropdownMatchSelectWidth ? 'width' : 'minWidth';
    }
    return (
      <Trigger
        ref={this.triggerRef}
        action={disabled ? [] : ['click']}
        popupPlacement="bottomLeft"
        builtinPlacements={BUILT_IN_PLACEMENTS}
        popupAlign={dropdownPopupAlign}
        prefixCls={dropdownPrefixCls}
        popupTransitionName={this.getDropdownTransitionName()}
        onPopupVisibleChange={dropdownVisibleChange}
        popup={popupElement}
        popupVisible={open}
        getPopupContainer={getPopupContainer}
        stretch={stretch}
        popupClassName={classNames(dropdownClassName, {
          [`${dropdownPrefixCls}--multiple`]: isMultiple,
          [`${dropdownPrefixCls}--single`]: !isMultiple,
        })}
        popupStyle={dropdownStyle}
      >
        {getSlot(this)}
      </Trigger>
    );
  },
};

export default SelectTrigger;

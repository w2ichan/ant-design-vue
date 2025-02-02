import { defineComponent } from 'vue';
import classNames from '../../../_util/classNames';
import PropTypes from '../../../_util/vue-types';
import addEventListener from '../../../vc-util/Dom/addEventListener';
import warning from '../../../_util/warning';
import { initDefaultProps, getSlot } from '../../../_util/props-util';
import Steps from './Steps';
import Marks from './Marks';
import Handle from '../Handle';
import * as utils from '../utils';
import BaseMixin from '../../../_util/BaseMixin';

function noop() {}

export default function createSlider(Component) {
  // const displayName = `ComponentEnhancer(${Component.displayName})`
  const propTypes = {
    min: PropTypes.number,
    max: PropTypes.number,
    step: PropTypes.number,
    marks: PropTypes.object,
    included: PropTypes.looseBool,
    prefixCls: PropTypes.string,
    disabled: PropTypes.looseBool,
    handle: PropTypes.func,
    dots: PropTypes.looseBool,
    vertical: PropTypes.looseBool,
    reverse: PropTypes.looseBool,
    minimumTrackStyle: PropTypes.object, // just for compatibility, will be deperecate
    maximumTrackStyle: PropTypes.object, // just for compatibility, will be deperecate
    handleStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.arrayOf(PropTypes.object)]),
    trackStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.arrayOf(PropTypes.object)]),
    railStyle: PropTypes.object,
    dotStyle: PropTypes.object,
    activeDotStyle: PropTypes.object,
    autofocus: PropTypes.looseBool,
  };
  return defineComponent({
    name: 'createSlider',
    inheritAttrs: false,
    mixins: [BaseMixin, Component],
    // model: {
    //   prop: 'value',
    //   event: 'change',
    // },
    props: initDefaultProps(propTypes, {
      prefixCls: 'rc-slider',
      min: 0,
      max: 100,
      step: 1,
      marks: {},
      included: true,
      disabled: false,
      dots: false,
      vertical: false,
      reverse: false,
      trackStyle: [{}],
      handleStyle: [{}],
      railStyle: {},
      dotStyle: {},
      activeDotStyle: {},
    }),
    data() {
      const { step, max, min } = this;
      const isPointDiffEven = isFinite(max - min) ? (max - min) % step === 0 : true; // eslint-disable-line
      warning(
        step && Math.floor(step) === step ? isPointDiffEven : true,
        'Slider',
        'Slider[max] - Slider[min] (%s) should be a multiple of Slider[step] (%s)',
        max - min,
        step,
      );
      this.handlesRefs = {};
      return {};
    },
    mounted() {
      this.$nextTick(() => {
        // Snapshot testing cannot handle refs, so be sure to null-check this.
        this.document = this.sliderRef && this.sliderRef.ownerDocument;
        // this.setHandleRefs()
        const { autofocus, disabled } = this;
        if (autofocus && !disabled) {
          this.focus();
        }
      });
    },
    beforeUnmount() {
      this.$nextTick(() => {
        // if (super.componentWillUnmount) super.componentWillUnmount()
        this.removeDocumentEvents();
      });
    },
    methods: {
      defaultHandle({ index, directives, className, style, ...restProps }) {
        delete restProps.dragging;
        if (restProps.value === null) {
          return null;
        }
        const handleProps = {
          ...restProps,
          class: className,
          style,
          key: index,
        };
        return <Handle {...handleProps} />;
      },
      onMouseDown(e) {
        if (e.button !== 0) {
          return;
        }
        const isVertical = this.vertical;
        let position = utils.getMousePosition(isVertical, e);
        if (!utils.isEventFromHandle(e, this.handlesRefs)) {
          this.dragOffset = 0;
        } else {
          const handlePosition = utils.getHandleCenterPosition(isVertical, e.target);
          this.dragOffset = position - handlePosition;
          position = handlePosition;
        }
        this.removeDocumentEvents();
        this.onStart(position);
        this.addDocumentMouseEvents();
        utils.pauseEvent(e);
      },
      onTouchStart(e) {
        if (utils.isNotTouchEvent(e)) return;

        const isVertical = this.vertical;
        let position = utils.getTouchPosition(isVertical, e);
        if (!utils.isEventFromHandle(e, this.handlesRefs)) {
          this.dragOffset = 0;
        } else {
          const handlePosition = utils.getHandleCenterPosition(isVertical, e.target);
          this.dragOffset = position - handlePosition;
          position = handlePosition;
        }
        this.onStart(position);
        this.addDocumentTouchEvents();
        utils.pauseEvent(e);
      },
      onFocus(e) {
        const { vertical } = this;
        if (utils.isEventFromHandle(e, this.handlesRefs)) {
          const handlePosition = utils.getHandleCenterPosition(vertical, e.target);
          this.dragOffset = 0;
          this.onStart(handlePosition);
          utils.pauseEvent(e);
          this.__emit('focus', e);
        }
      },
      onBlur(e) {
        this.onEnd();
        this.__emit('blur', e);
      },
      onMouseUp() {
        if (this.handlesRefs[this.prevMovedHandleIndex]) {
          this.handlesRefs[this.prevMovedHandleIndex].clickFocus();
        }
      },
      onMouseMove(e) {
        if (!this.sliderRef) {
          this.onEnd();
          return;
        }
        const position = utils.getMousePosition(this.vertical, e);
        this.onMove(e, position - this.dragOffset);
      },
      onTouchMove(e) {
        if (utils.isNotTouchEvent(e) || !this.sliderRef) {
          this.onEnd();
          return;
        }

        const position = utils.getTouchPosition(this.vertical, e);
        this.onMove(e, position - this.dragOffset);
      },
      onKeyDown(e) {
        if (this.sliderRef && utils.isEventFromHandle(e, this.handlesRefs)) {
          this.onKeyboard(e);
        }
      },
      onClickMarkLabel(e, value) {
        e.stopPropagation();
        this.onChange({ sValue: value });
        this.setState({ sValue: value }, () => this.onEnd(true));
      },
      getSliderStart() {
        const slider = this.sliderRef;
        const { vertical, reverse } = this;
        const rect = slider.getBoundingClientRect();
        if (vertical) {
          return reverse ? rect.bottom : rect.top;
        }
        return window.pageXOffset + (reverse ? rect.right : rect.left);
      },
      getSliderLength() {
        const slider = this.sliderRef;
        if (!slider) {
          return 0;
        }

        const coords = slider.getBoundingClientRect();
        return this.vertical ? coords.height : coords.width;
      },
      addDocumentTouchEvents() {
        // just work for Chrome iOS Safari and Android Browser
        this.onTouchMoveListener = addEventListener(this.document, 'touchmove', this.onTouchMove);
        this.onTouchUpListener = addEventListener(this.document, 'touchend', this.onEnd);
      },
      addDocumentMouseEvents() {
        this.onMouseMoveListener = addEventListener(this.document, 'mousemove', this.onMouseMove);
        this.onMouseUpListener = addEventListener(this.document, 'mouseup', this.onEnd);
      },
      removeDocumentEvents() {
        /* eslint-disable no-unused-expressions */
        this.onTouchMoveListener && this.onTouchMoveListener.remove();
        this.onTouchUpListener && this.onTouchUpListener.remove();

        this.onMouseMoveListener && this.onMouseMoveListener.remove();
        this.onMouseUpListener && this.onMouseUpListener.remove();
        /* eslint-enable no-unused-expressions */
      },
      focus() {
        if (!this.disabled) {
          this.handlesRefs[0].focus();
        }
      },
      blur() {
        if (!this.disabled) {
          Object.keys(this.handlesRefs).forEach(key => {
            if (this.handlesRefs[key] && this.handlesRefs[key].blur) {
              this.handlesRefs[key].blur();
            }
          });
        }
      },
      calcValue(offset) {
        const { vertical, min, max } = this;
        const ratio = Math.abs(Math.max(offset, 0) / this.getSliderLength());
        const value = vertical ? (1 - ratio) * (max - min) + min : ratio * (max - min) + min;
        return value;
      },
      calcValueByPos(position) {
        const sign = this.reverse ? -1 : +1;
        const pixelOffset = sign * (position - this.getSliderStart());
        const nextValue = this.trimAlignValue(this.calcValue(pixelOffset));
        return nextValue;
      },
      calcOffset(value) {
        const { min, max } = this;
        const ratio = (value - min) / (max - min);
        return ratio * 100;
      },
      saveSlider(slider) {
        this.sliderRef = slider;
      },
      saveHandle(index, handle) {
        this.handlesRefs[index] = handle;
      },
    },
    render() {
      const {
        prefixCls,
        marks,
        dots,
        step,
        included,
        disabled,
        vertical,
        reverse,
        min,
        max,
        maximumTrackStyle,
        railStyle,
        dotStyle,
        activeDotStyle,
      } = this;
      const { class: className, style, id } = this.$attrs;
      const { tracks, handles } = this.renderSlider();

      const sliderClassName = classNames(prefixCls, className, {
        [`${prefixCls}-with-marks`]: Object.keys(marks).length,
        [`${prefixCls}-disabled`]: disabled,
        [`${prefixCls}-vertical`]: vertical,
      });
      const markProps = {
        vertical,
        marks,
        included,
        lowerBound: this.getLowerBound(),
        upperBound: this.getUpperBound(),
        max,
        min,
        reverse,
        class: `${prefixCls}-mark`,
        onClickLabel: disabled ? noop : this.onClickMarkLabel,
      };
      return (
        <div
          id={id}
          ref={this.saveSlider}
          tabindex="-1"
          class={sliderClassName}
          onTouchstart={disabled ? noop : this.onTouchStart}
          onMousedown={disabled ? noop : this.onMouseDown}
          onMouseup={disabled ? noop : this.onMouseUp}
          onKeydown={disabled ? noop : this.onKeyDown}
          onFocus={disabled ? noop : this.onFocus}
          onBlur={disabled ? noop : this.onBlur}
          style={style}
        >
          <div
            class={`${prefixCls}-rail`}
            style={{
              ...maximumTrackStyle,
              ...railStyle,
            }}
          />
          {tracks}
          <Steps
            prefixCls={prefixCls}
            vertical={vertical}
            reverse={reverse}
            marks={marks}
            dots={dots}
            step={step}
            included={included}
            lowerBound={this.getLowerBound()}
            upperBound={this.getUpperBound()}
            max={max}
            min={min}
            dotStyle={dotStyle}
            activeDotStyle={activeDotStyle}
          />
          {handles}
          <Marks {...markProps} />
          {getSlot(this)}
        </div>
      );
    },
  });
}

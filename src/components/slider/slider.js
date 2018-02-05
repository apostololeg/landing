import { bind } from 'decko'
import {
    isLandscape,
    onOrientationChange,
    unOrientationChange } from '../../utils/orientation.js'
import { pointerEvents } from '../../utils/pointerEvents.js'
import './slider.styl'

const translateX = x => 'translate3d(' + x + 'px, 0, 0)'
const getStyles = (elem, style) => window.getComputedStyle(elem)[style]
const once = function(elem, event, fn) {
    const callback = () => {
        elem.removeEventListener(event, callback)
        fn()
    }

    elem.addEventListener(event, callback)
}

class Slider {
    constructor(domElem, props) {
        this.domElem = domElem
        this.props = {
            step: 100,
            threshold: 50,
            ...props
        }

        if (props.autoinit) {
            this.init()
        }
    }

    setMod(mod) {
        this.domElem.classList.add(mod)
    }

    delMod(mod) {
        this.domElem.classList.remove(mod)
    }

    init() {
        const images = this.domElem.querySelectorAll('img')

        onOrientationChange(this._activate)

        if (!images.length) {
            this._activate()
            return
        }

        this._waitForImages(images)
            .then(this._activate)
    }

    _waitForImages(images) {
        return Promise.all(images.map((img) => {
            const { src, width, complete } = img

            if (!src || width || complete) {
                return Promise.resolve()
            }

            return new Promise(resolve => {
                img.addEventListener('load', resolve)
                img.addEventListener('error', resolve)
            })
        }))
    }

    @bind _activate() {
        const {
            index,
            perScreen } = this.props

        this._inner = this.domElem.querySelector('.slider-inner')
        this._canvas = this.domElem.querySelector('.slider-canvas')
        this._controls = this.domElem.querySelectorAll('.slider-control')
        this._items = this._canvas.querySelectorAll('.slider-item')

        this._index = index || 0
        this._currentX = this._currentX || 0
        this._touch = {}

        this._calcParams()

        if (this._controls.length && this._canvasWidth > this._width) {
            this._controls.forEach(control => control.addEventListener('click', this._onControlClick))
            this.domElem.classList.add('slider_controls')
            this._calcParams()
        }

        if (perScreen) {
            this._count = this._items.length
            this._step = this._width

            this._items.forEach(item => item.style.width = `${this._width}px`)
            this._calcParams()

            onOrientationChange(this._setItemsWidth)
        }

        if (this._canvasWidth > this._width) {
            this._initOnDemand()
            this.domElem.addEventListener('scroll', e => console.log(e))
        }

    }

    _calcParams() {
        const {
            step,
            perScreen } = this.props

        this._width = this._inner.clientWidth
        this._canvasWidth = this._canvas.offsetWidth
        this._step = perScreen ? this._width : step
        this._limitX = this._width - this._canvas.offsetWidth
        this._isShort = this._width >= this._canvasWidth
    }

    @bind _setItemsWidth() {
        this._items.forEach(item => item.style.width = `${this._width}px`)
    }

    _initOnDemand() {
        const {
            onInit,
            perScreen } = this.props

        // если начальный элемент не первый
        if (this._index) {
            // если полноэкранный слайдер
            if (perScreen) {
                // коррекция начального смещения при непервом начальном элементе в поэкранном слайдере
                this._correctPerScreenNonFirst()
            } else {
                // коррекция начального смещения при непервом начальном элементе в обычном слайдере
                this._correctPerStepNonFirst()
            }
        }

        this._initCanvasPosition()
        this.domElem.addEventListener(pointerEvents.down, this._onPointerDown)
        onOrientationChange(this._correctOnOrientChange)

        this._onDemandInited = true

        if (onInit) {
            onInit(this._getCurrentParams())
        }
    }


    _initCanvasPosition() {
        this._currentX = 100
        this._correct()


        setTimeout(() => {
            this._currentX = 0
            this._updateTransition()
            this._correct(this._transition)
        }, 0)
    }

    // коррекция начального смещения при непервом начальном элементе в поэкранном слайдере
    _correctPerScreenNonFirst() {
        this._currentX = -this._step * (--this._index)
        this._correct()
    }

    // коррекция начального смещения при непервом начальном элементе в обычном слайдере
    _correctPerStepNonFirst() {
        for (var i = 0; i <= this._index - 1; i++) {
            this._currentX -= this._items[i].offsetWidth
        }

        this._currentX -= parseInt(getStyles(this._items[this._index], 'padding-left'))
        this._correct()
    }

    @bind _correctOnOrientChange() {
        const { perScreen } = this.props
        const lastWidthState = this._isShort

        this._calcParams()

        if (lastWidthState != this._isShort) {
            this._onDemandInited || this._initOnDemand()
        }

        if (this._limitX > 0) {
            this._currentX = this._limitX = 0
        }

        if (perScreen) {
            this._currentX = -this._step * this._index
        }

        if (isLandscape() && this._currentX < this._limitX && this._canvasWidth > this._width) {
            this._currentX = this._limitX
            this._correct()
        }

        this._correct()
    }

    _getCurrentParams() {
        return {
            currentX: this._currentX,
            limitX: this._limitX,
            step: this._step,
            index: this._index,
            count: this._count,
            active: this._canvasWidth > this._width
        }
    }

    _correct(transition = 'none') {
        this._canvas.style.transition = transition
        this._canvas.style.transform = translateX(this._currentX)
    }

    @bind _onControlClick({ target }) {
        if (target.classList.contains('left')) {
            this.left()
        }

        if (target.classList.contains('right')) {
            this.right()
        }
    }

    @bind _onWindowPointerMove(e) {
        e.preventDefault()
        e.stopPropagation()
    }

    @bind _onPointerDown(e) {
        const { x, y } = pointerEvents.getPointer(e)

        this._touch.x1 = x
        this._touch.y1 = y
        this._touch.t1 = Date.now()
        this._touch.isPressed = true

        // отключаем анимацию на время реалтаймового слайда
        this._canvas.style.transition = 'none'

        this._bindPointer()
    }

    @bind _onPointerMove(e) {
        const { x, y } = pointerEvents.getPointer(e)

        if (Math.abs(this._touch.shiftX) > 5) {
            this.setMod('moving')
        }

        if (this._touch.isPressed) {
            this._touch.shiftX = x - this._touch.x1
            this._touch.shiftY = y - this._touch.y1

            this._touch.shiftXAbs = Math.abs(this._touch.shiftX)
            this._touch.shiftYAbs = Math.abs(this._touch.shiftY)

            // если мы ещё не определились
            if (!this._touch.isSlide && !this._touch.isScroll) {

                if (this._touch.shiftYAbs >= 5 && this._touch.shiftYAbs > this._touch.shiftXAbs) {
                    this._touch.isScroll = true
                }

                if (this._touch.shiftXAbs >= 5 && this._touch.shiftXAbs > this._touch.shiftYAbs) {
                    this._touch.isSlide = true
                }
            }

            if (this._touch.isSlide) {
                let leftLimitReached = this._currentX >= 0 && this._touch.shiftX > 0
                let rightLimitReached = this._currentX <= this._limitX && this._touch.shiftX < 0

                // запрещаем скролл
                e.preventDefault()
                e.stopPropagation()

                if (leftLimitReached || rightLimitReached) {
                    this._touch.shiftX = this._touch.shiftX / 3
                }

                // реалтаймловый слайд
                this._canvas.style.transform = translateX(this._currentX + this._touch.shiftX)
            }
        }
    }

    @bind _onPointerUp(e) {
        if (this._touch.isSlide) {
            this._slideMove()
        }

        this._unbindPointer()
        this.delMod('moving')

        this._touch = {}
    }

    _onLimitLeft() {
        const { onLimitLeft } = this.props
        const control = this._controls[0]

        if (control) {
            control.classList.add('disabled')
        }

        if (onLimitLeft) {
            onLimitLeft()
        }
    }

    _onLimitRight() {
        const { onLimitRight } = this.props
        const control = this._controls[0]

        if (control) {
            control.classList.add('disabled')
        }

        if (onLimitRight) {
            onLimitRight()
        }
    }

    _bindPointer() {
        const {
            move,
            up,
            cancel } = pointerEvents

        document.body.addEventListener(move, this._onWindowPointerMove)
        this.domElem.addEventListener(move, this._onPointerMove)
        this.domElem.addEventListener(up, this._onPointerUp)
        this.domElem.addEventListener(cancel, this._onPointerUp)
    }

    _unbindPointer() {
        const {
            move,
            up,
            cancel } = pointerEvents

        document.body.removeEventListener(move, this._onWindowPointerMove)
        this.domElem.removeEventListener(move, this._onPointerMove)
        this.domElem.removeEventListener(up, this._onPointerUp)
        this.domElem.removeEventListener(cancel, this._onPointerUp)
    }

    _slideMove() {
        const {
            perScreen,
            threshold } = this.props

        // скорость в px/ms
        this._touch.speed = this._touch.shiftXAbs / (Date.now() - this._touch.t1)

        if (perScreen) {
            // в поэкранном слайдере нет ускорения
            this._touch.accel = 1
        } else {
            this._touch.accel =
                this._touch.speed > 0.3 && this._touch.speed < 0.6 ? 2 :
                this._touch.speed >= 0.6 && this._touch.speed < 1 ? 3 :
                this._touch.speed >= 1 ? 4 :
                1
        }

        this._updateTransition(true)

        // если слайд преодолел порог
        if (this._touch.shiftXAbs >= threshold) {
            // слайд длиной больше одного шага
            if (this._touch.shiftXAbs > this._step) {
                this._currentX += ~~(this._touch.shiftX / this._step) * this._step
            }

            // слайд вправо
            if (this._touch.shiftX > 0) {
                this._currentX += this._step * this._touch.accel

                // левый предел
                if (this._currentX > 0) {
                    this._currentX = 0
                    this._onLimitLeft({ left: true })
                }

                // индекс текущего экрана
                if (perScreen && this._index > 0) {
                    this._index--
                }
            // слайд влево
            } else if (this._touch.shiftX < 0) {
                this._currentX -= this._step * this._touch.accel

                // правый предел
                if (this._currentX < this._limitX) {
                    this._currentX = this._limitX
                    this._onLimitRight({ right: true })
                }

                // индекс текущего экрана
                if (perScreen && this._index < this._count - 1) {
                    this._index++
                }
            }
        }

        this._doAnimation()
    }

    _customMove(currentX) {
        const { perScreen } = this.props
        const lastCurrentX = this._currentX

        this._updateTransition()
        this._currentX = currentX

        // to right
        if (currentX > lastCurrentX) {
            if (this._currentX > 0) {
                this._currentX = 0
                this._onLimitLeft()
            }

            if (perScreen && this._index >= 1) {
                this._index--
            }
        // to left
        } else if (currentX < lastCurrentX) {
            if (this._currentX <= this._limitX) {
                this._currentX = this._limitX
                this._onLimitRight()
            }

            if (perScreen && this._index <= this._count) {
                this._index++
            }
        }

        this._doAnimation()
    }

    _updateTransition(accel) {
        this._touch.animationTime = this._getAnimationTime(accel)
        this._transition = `all ${this._touch.animationTime}s ease-out`
    }

    _getAnimationTime(accel) {
        const landscape = isLandscape()

        if (accel) {
            if (landscape) {
                return this._touch.accel >= 3 ? '.3' : '.4'
            }

            return this._touch.accel >= 3 ? '.2' : '.3'
        }

        return landscape ? '.3' : '.2'
    }

    _doAnimation() {
        this._onStart()

        once(this._canvas, 'transitionend', this._onEnd)
        this._correct(this._transition)
    }

    @bind _onStart() {
        this.setMod('animation')
    }

    @bind _onEnd() {
        this.delMod('animation')
    }

    moveToElem(elem) {
        this._customMove(-elem.offsetLeft)
    }

    _getCurrentItem() {
        const items = Array.prototype.slice.call(this.domElem.querySelectorAll('.slider-item'))
        let data;

        items.some((item, i) => {
            let {
                offsetLeft,
                offsetWidth } = item

            if (this._currentX + offsetLeft + offsetWidth > 0) {
                data = {
                    prev: items[i - 1],
                    item,
                    next: items[i + 1]
                }

                return true
            }
        })

        return data
    }

    right() {
        const {
            item,
            next } = this._getCurrentItem()

        if (this._currentX === this._limitX) {
            return
        }

        if (this._currentX - item.offsetLeft <= 0) {
            this._customMove(-(item.offsetLeft + item.offsetWidth))
            return
        }

        if (next) {
            this._customMove(-(next.offsetLeft + next.offsetWidth))
        }
    }

    left() {
        const {
            prev,
            item } = this._getCurrentItem()

        if (this._currentX - this.domElem.offsetWidth === this._limitX) {
            return
        }

        if (this._currentX + item.offsetLeft < 0) {
            this._customMove(-item.offsetLeft)
            return
        }

        if (prev) {
            this._customMove(-prev.offsetLeft)
        }


    }
}

export default Slider

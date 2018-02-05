// https://stackoverflow.com/a/41601290/2131453

class preventFixedScroll {
    constructor(elem) {
        elem.style = (elem.style || '') + ';-webkit-overflow-scrolling: touch;'

        this._elem = elem
        this._clientY = null // remember Y position on touch start


        this._bindTouches()
    }

    _bindTouches() {
        this._elem.addEventListener('touchstart', e => {
            if (e.targetTouches.length === 1) {
                // detect single touch
                this._clientY = e.targetTouches[0].clientY
            }
        }, false)

        this._elem.addEventListener('touchmove', e => {
            if (e.targetTouches.length === 1) {
                // detect single touch
                this._disableRubberBand(e)
            }
        }, false)
    }

    _disableRubberBand(e) {
        var clientY = e.targetTouches[0].clientY - this._clientY

        if (this._elem.scrollTop === 0 && clientY > 0) {
            // element is at the top of its scroll
            e.preventDefault()
        }

        if (this._isOverlayTotallyScrolled() && clientY < 0) {
            // element is at the top of its scroll
            e.preventDefault()
        }
    }

    _isOverlayTotallyScrolled() {
        const {
            scrollTop,
            scrollHeight,
            clientHeight } = this._elem

        // https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollHeight#Problems_and_solutions
        return scrollHeight - scrollTop <= clientHeight
    }
}

export default preventFixedScroll

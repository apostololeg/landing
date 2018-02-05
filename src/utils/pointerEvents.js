export const isTouch = 'ontouchstart' in window
    || navigator.maxTouchPoints > 0
    || navigator.msMaxTouchPoint

export const pointerEvents = isTouch ? {
    down: 'touchstart',
    move: 'touchmove',
    up: 'touchend',
    cancel: 'touchcancel',
    getPointer: ({ touches }) => ({
        x: touches[0].clientX,
        y: touches[0].clientY
    })
} : {
    down: 'mousedown',
    move: 'mousemove',
    up: 'mouseup',
    cancel: '',
    getPointer: ({ clientX, clientY }) => ({
        x: clientX,
        y: clientY
    })
}

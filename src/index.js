import throttle from './utils/throttle.js'
import preventFixedScroll from './utils/preventFixedScroll.js'
import { isTouch } from './utils/pointerEvents.js'
import Slider from './components/slider/slider.js'
import Neural from './components/neural/neural.js'
import './index.styl'

const { body } = document
const $ = s => document.querySelector(s)

const getCurrNav = () => document
    .elementFromPoint(0, 100)
    .id

let currentNav = $('.nav a').href.split('#')[1]

function onScroll() {
    updateScrolled()
    updateNav()
}

function onNavClick(e) {
    currentNav = getCurrNav()
}

function updateScrolled() {
    if (window.scrollY > 20) {
        body.classList.add('scrolled')
    } else {
        body.classList.remove('scrolled')
    }
}

function updateNav() {
    let nav = getCurrNav()

    if (currentNav !== nav) {
        changeCurrent(nav)
    }
}

function changeCurrent(nav) {
    let currentElem = $('.nav .current')
    let newCurrentElem = nav === ''
        ? $(`.nav a[href="/"]`)
        : $(`.nav a[href="#${nav}"]`)

    currentNav = nav
    history.pushState({}, '', `#${nav}`)

    if (currentElem) {
        currentElem.classList.remove('current')
    }

    if (newCurrentElem) {
        newCurrentElem.classList.add('current')
        headerSlider.moveToElem(newCurrentElem)
    }
}


// init
const headerSlider = new Slider($('.header .slider'), { autoinit: true })
const mediaSlider = new Slider($('.media .slider'), { autoinit: true })
const neuralVusualisation = new Neural($('.neural'))

new preventFixedScroll($('.header'))

// binds
$('.nav a').addEventListener('click', onNavClick)
window.addEventListener('scroll', () => throttle(onScroll, 100))
document.body.classList.add(isTouch ? 'touch' : 'mouse')

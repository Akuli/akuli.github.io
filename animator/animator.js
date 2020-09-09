function getSmallestNeededCoords(actions) {
  let xMin = Infinity;
  let yMin = Infinity;
  let xMapping = new Map();
  let yMapping = new Map();

  function updateMins() {
    xMin = Math.min(xMin, ...xMapping.values());
    yMin = Math.min(yMin, ...yMapping.values());
    if (isNaN(xMin) || isNaN(yMin)) {
      throw new Error("NaN problem");
    }
  }

  for (const action of actions.filter(action => ['create', 'config'].includes(action.type))) {
    if (action.x !== undefined) {
      xMapping.set(action.element, action.x);
    }
    if (action.y !== undefined) {
      yMapping.set(action.element, action.y);
    }
    updateMins();
    if (action.dx) {
      xMapping.set(action.element, xMapping.get(action.element) + action.dx);
    }
    if (action.dy) {
      yMapping.set(action.element, yMapping.get(action.element) + action.dy);
    }
    updateMins();
  }

  if (!isFinite(xMin) || !isFinite(yMin)) {
    throw new Error("infinity or NaN problem");
  }
  return {xMin, yMin};
}

class Animator {
  constructor(contentDiv, steps) {
    this._contentDiv = contentDiv;
    this.steps = steps;
    this.stepIndex = 0;
    this._undoCallbacks = [];  // contents are like: {stepIndex: 123, run: () => {...}}

    let {xMin, yMin} = getSmallestNeededCoords(steps.flat());
    this._translateX = -xMin;
    this._translateY = -yMin;

    this.showNext();  // first step always done
  }

  set(object, property, newValue) {
    const oldValue = object[property];
    object[property] = newValue;
    this._undoCallbacks.push({stepIndex: this.stepIndex, run: () => {
      object[property] = oldValue;
    }});
  }

  showPrev() {
    if (this.stepIndex <= 0 || this.stepIndex > this.steps.length) {
      throw new Error("bad stepIndex");
    }

    this.stepIndex--;
    while (this._undoCallbacks.length !== 0 &&
           this._undoCallbacks[this._undoCallbacks.length - 1].stepIndex >= this.stepIndex)
    {
      this._undoCallbacks.pop().run();
    }
  }

  _handleClass(className, domElement) {
    if (!domElement.classList.contains(className)) {
      this._undoCallbacks.push({stepIndex: this.stepIndex, run: () => domElement.classList.remove(className)});
    }
    domElement.classList.add(className);
  }

  showNext() {
    if (this.stepIndex < 0 || this.stepIndex >= this.steps.length) {
      throw new Error("bad stepIndex");
    }

    for (let action of this.steps[this.stepIndex]) {
      switch(action.type) {
        case 'create':
          if (action.element.parentElement) {
            throw new Error("already created");
          }
          this._contentDiv.appendChild(action.element);
          this._undoCallbacks.push({stepIndex: this.stepIndex, run: () => {
            action.element.parentElement.removeChild(action.element);
          }});
          // fall through to config

        case 'config':
          if (action.textContent !== undefined) {
            this.set(action.element, 'textContent', action.textContent + '');
          }
          if (action.classes) {
            for (const className of action.classes.split(' ')) {
              this._handleClass(className, action.element);
            }
          }
          if (action.zIndex !== undefined) {
            this.set(action.element.style, 'zIndex', action.zIndex);
          }
          if (action.x !== undefined) {
            this.set(action.element.style, 'left', `calc(${this._translateX + action.x}*var(--math-unit))`);
          }
          if (action.y !== undefined) {
            this.set(action.element.style, 'top', `calc(${this._translateY + action.y}*var(--math-unit))`);
          }
          if (action.dx) {
            const insideCalc = action.element.style.left.slice('calc('.length, -')'.length);
            this.set(action.element.style, 'left', `calc((${insideCalc}) + ${action.dx}*var(--math-unit))`);
          }
          if (action.dy) {
            const insideCalc = action.element.style.top.slice('calc('.length, -')'.length);
            this.set(action.element.style, 'top', `calc((${insideCalc}) + ${action.dy}*var(--math-unit))`);
          }
          break;

        case 'delete':
          const parent = action.element.parentNode;
          const nextSibling = action.element.nextSibling;   // may be null
          this._undoCallbacks.push({stepIndex: this.stepIndex, run: () => {
            parent.insertBefore(action.element, nextSibling)
          }});
          parent.removeChild(action.element);
          break;

        default:
          throw new Error(`unknown action type: ${action.type}`);
      }
    }
    this.stepIndex++;
  }
};

function showAnimation(elementId, steps) {
  const div = document.getElementById(elementId);

  // nested divs needed because absolute positioning is awesome
  div.innerHTML = '<div class="animation-content"><div></div></div><button>Previous</button><button>Next</button>';
  const [outerContentDiv, prevButton, nextButton] = div.children;
  const [innerContentDiv] = outerContentDiv.children;
  const animator = new Animator(innerContentDiv, steps);

  function updateButtons() {
    prevButton.disabled = (animator.stepIndex === 1);
    nextButton.disabled = (animator.stepIndex === animator.steps.length);
  }

  prevButton.addEventListener('click', () => { animator.showPrev(); updateButtons(); });
  nextButton.addEventListener('click', () => { animator.showNext(); updateButtons(); });
  updateButtons();
}

function sumOfIntegersUpTo(n) {
  return n*(n+1)/2;
}

function range(n) {
  return Array(n).fill().map((junk, number) => number);
}

document.addEventListener('DOMContentLoaded', () => {
  const n = 7;

  const differentSizeSquares = range(n)
    .map(i => i+1)
    .map(size =>
      range(n*n)
      .map(i => ({x: i%n, y: Math.floor(i/n)}))
      .filter(({x, y}) => x < size && y < size)
      .map(({x, y}) => ({
        x,
        y,
        element: document.createElement('div'),
        initialX: (
          (size >= 5) ?
            sumOfIntegersUpTo(size-1)-sumOfIntegersUpTo(4) + (size-5)
          :
            sumOfIntegersUpTo(size-1) + (size-1)
        ) + x - n,
        initialY: ((size >= 5) ? 5 : 0) + y - n,
      }))
    );

  const basicSquares = differentSizeSquares[n-1];

  const topCopy  = range(n*n).map(i => ({x: i%n, y: Math.floor(i/n), element: document.createElement('div')}));
  const leftCopy = range(n*n).map(i => ({x: i%n, y: Math.floor(i/n), element: document.createElement('div')}));

  showAnimation('animation', [
    differentSizeSquares.map((squareList, size) => squareList.map(({x, y, initialX, initialY, element}) => ({
      type: 'create',
      element,
      x: initialX,
      y: initialY,
      textContent: 1,
      classes: 'square',
    }))).flat(),

    differentSizeSquares.map(squareList => squareList.map(({x, y, element}) => ({
      type: 'config',
      element, x, y,
      textContent: (squareList.length === n*n) ? (n - Math.max(x, y)) : undefined,
    }))).flat(),

    (
      differentSizeSquares
      .filter(squareList => squareList.length !== n*n)
      .flat()
      .map(({element}) => ({type: 'delete', element}))
    ).concat(
      topCopy.concat(leftCopy).map(({x, y, element}) => ({
        type: 'create',
        element, x, y,
        textContent: n - Math.max(x, y),
        classes: 'square',
        zIndex: -1,
      }))
    ).concat(
      topCopy.map(({element}) => ({type: 'config', element, classes: 'color1'}))
    ).concat(
      leftCopy.map(({element}) => ({type: 'config', element, classes: 'color2'}))
    ),

    (
      topCopy.map(({x, y, element}) => ({type: 'config', element, x, y: -y-1}))
    ).concat(
      leftCopy.map(({x, y, element}) => ({type: 'config', element, x: -x-1, y}))
    ),

    basicSquares.map(({x, y, element}) => ({
      type: 'config',
      dx: (x < y) ? -n : (x > y) ? n : 0,
      dy: (x < y) ? n : (x > y) ? -n : 0,
      element,
    })),

    basicSquares.map(({x, y, element}) => ({
      type: 'config',
      dx: (x > y) ? -y : 0,
      dy: (x < y) ? -x : 0,
      zIndex: 1,
      element,
    })),

    ...range(n-1).map(movingRowOrColumn =>
      basicSquares
      .filter(({x, y}) => x !== y && Math.min(x, y) === movingRowOrColumn)
      .map(({x, y, element}) => ({
        type: 'config',
        element,
        classes: 'merged',
        textContent: n - Math.abs(x-y) + 1,
        ...(x<y ? {dy: -n-1} : {dx: -n-1}),
      }))
    ),
  ]);
});

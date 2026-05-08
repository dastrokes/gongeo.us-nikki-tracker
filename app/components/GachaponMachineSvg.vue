<template>
  <svg
    class="whim-o-matic-svg"
    :class="{ 'is-rolling': rolling, 'is-revealed': revealed }"
    viewBox="0 0 512 640"
    role="img"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient
        id="somRedGradient"
        x1="150"
        y1="50"
        x2="375"
        y2="610"
        gradientUnits="userSpaceOnUse"
      >
        <stop
          offset="0"
          stop-color="#D65767"
        />
        <stop
          offset="0.52"
          stop-color="#B44F63"
        />
        <stop
          offset="1"
          stop-color="#C94B5C"
        />
      </linearGradient>

      <linearGradient
        id="somGoldGradient"
        x1="120"
        y1="55"
        x2="380"
        y2="560"
        gradientUnits="userSpaceOnUse"
      >
        <stop
          offset="0"
          stop-color="#FFE083"
        />
        <stop
          offset="0.58"
          stop-color="#F2C96C"
        />
        <stop
          offset="1"
          stop-color="#C9972D"
        />
      </linearGradient>

      <linearGradient
        id="somGlassGradient"
        x1="160"
        y1="82"
        x2="350"
        y2="380"
        gradientUnits="userSpaceOnUse"
      >
        <stop
          offset="0"
          stop-color="#D7D0D6"
          stop-opacity="0.38"
        />
        <stop
          offset="0.46"
          stop-color="#9E8A91"
          stop-opacity="0.34"
        />
        <stop
          offset="1"
          stop-color="#69515B"
          stop-opacity="0.45"
        />
      </linearGradient>

      <linearGradient
        id="somWindowGradient"
        x1="214"
        y1="430"
        x2="300"
        y2="504"
        gradientUnits="userSpaceOnUse"
      >
        <stop
          offset="0"
          stop-color="#B5BDC5"
        />
        <stop
          offset="1"
          stop-color="#8E98A4"
        />
      </linearGradient>

      <filter
        id="somShadow"
        x="-18%"
        y="-10%"
        width="136%"
        height="122%"
        color-interpolation-filters="sRGB"
      >
        <feDropShadow
          dx="0"
          dy="10"
          stdDeviation="7"
          flood-color="#4D2232"
          flood-opacity="0.28"
        />
      </filter>

      <clipPath id="windowClip">
        <rect
          x="211"
          y="410"
          width="90"
          height="90"
          rx="18"
        />
      </clipPath>

      <clipPath id="globeClip">
        <path
          d="M 172 68 C 142 94 128 145 132 190 C 136 245 178 285 188 346 L 324 346 C 334 285 376 245 380 190 C 384 145 370 94 340 68 Z"
        />
      </clipPath>
    </defs>

    <g
      class="machine"
      filter="url(#somShadow)"
    >
      <!-- Base Shadow -->
      <ellipse
        cx="256"
        cy="622"
        rx="150"
        ry="14"
        fill="#4D2232"
        opacity="0.42"
      />

      <!-- Lever (Behind the base) -->
      <g class="lever">
        <line
          x1="152"
          y1="432"
          x2="102"
          y2="340"
          stroke="#D4C5C4"
          stroke-width="13"
          stroke-linecap="round"
        />
        <line
          x1="84"
          y1="306"
          x2="102"
          y2="340"
          stroke="#B44F63"
          stroke-width="26"
          stroke-linecap="round"
        />

        <line
          x1="100"
          y1="356"
          x2="117"
          y2="347"
          stroke="url(#somGoldGradient)"
          stroke-width="12"
          stroke-linecap="round"
        />
        <circle
          cx="152"
          cy="432"
          r="26"
          fill="url(#somGoldGradient)"
        />
        <circle
          cx="152"
          cy="432"
          r="10"
          fill="#4D2232"
          opacity="0.18"
        />
      </g>

      <!-- Feet (Behind Base) -->
      <path
        d="M 144 574 C 161 570 180 579 183 600 C 186 616 175 633 158 633 C 139 633 145 612 145 602 C 145 591 135 580 144 574 Z"
        fill="#C9B9BB"
      />
      <path
        d="M 368 574 C 351 570 332 579 329 600 C 326 616 337 633 354 633 C 373 633 367 612 367 602 C 367 591 377 580 368 574 Z"
        fill="#C9B9BB"
      />

      <!-- Main Base Trapezoid -->
      <path
        d="M 162 350 L 350 350 L 396 590 Q 398 600 386 600 L 126 600 Q 114 600 116 590 Z"
        fill="url(#somRedGradient)"
      />
      <path
        d="M 162 350 L 350 350 L 356 378 L 156 378 Z"
        fill="#F06A78"
        opacity="0.38"
      />
      <!-- Base Bottom Gold Trim -->
      <path
        d="M 122 560 L 390 560 L 392 569 L 120 569 Z"
        fill="url(#somGoldGradient)"
      />

      <!-- Front Window -->
      <!-- Outer Grey Rim -->
      <path
        d="M 197 512 L 197 433 C 197 409 216 395 240 395 L 272 395 C 296 395 315 409 315 433 L 315 512 Z"
        fill="#D7C9C5"
      />
      <!-- Inner Dark Hole -->
      <path
        d="M 211 503 L 211 433 C 211 416 225 407 242 407 L 270 407 C 287 407 301 416 301 433 L 301 503 Z"
        fill="url(#somWindowGradient)"
      />
      <!-- Yellow Tray Shadow -->
      <rect
        x="196"
        y="507"
        width="120"
        height="17"
        rx="9"
        fill="#7D3748"
        opacity="0.35"
      />
      <!-- Yellow Dispenser Tray -->
      <rect
        x="196"
        y="499"
        width="120"
        height="18"
        rx="9"
        fill="url(#somGoldGradient)"
      />

      <!-- Prize Capsule -->
      <g clip-path="url(#windowClip)">
        <g class="prize-capsule capsule">
          <g class="prize-capsule-rotator">
            <circle
              cx="256"
              cy="432"
              r="23"
              fill="#F5C7CF"
            />
            <path
              d="M 233 432 A 23 23 0 0 0 279 432 Z"
              fill="#A9D66F"
            />
            <line
              x1="233"
              y1="432"
              x2="279"
              y2="432"
              stroke="#FFFFFF"
              stroke-width="2"
              opacity="0.5"
            />
          </g>
        </g>
      </g>

      <!-- Glass Globe Background -->
      <path
        d="M 172 68 C 142 94 128 145 132 190 C 136 245 178 285 188 346 L 324 346 C 334 285 376 245 380 190 C 384 145 370 94 340 68 Z"
        fill="url(#somGlassGradient)"
        stroke="#D7D0D6"
        stroke-width="4"
        stroke-opacity="0.88"
      />

      <!-- Globe Base Ring (Gold) -->
      <rect
        x="180"
        y="338"
        width="152"
        height="12"
        rx="4"
        fill="#D8CBC6"
        data-v-03d33d03=""
      ></rect>

      <!-- Globe contents (clipped) -->
      <g clip-path="url(#globeClip)">
        <!-- Crescent Moon (NOT animated) -->
        <path
          d="M 259.4 104 A 44.6 44.6 0 1 1 211.2 176 A 46.1 46.1 0 0 0 259.4 104 Z"
          fill="#FFF2C7"
        />

        <g class="globe-contents">
          <!-- Coiled Spring -->
          <g class="spring">
            <path
              d="M 214 347 C 258 337 310 340 290 329 C 272 319 213 327 224 314 C 238 302 301 306 292 296"
              fill="none"
              stroke="url(#somGoldGradient)"
              stroke-width="11"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </g>

          <!-- Capsules -->
          <g class="capsules">
            <!-- Back row -->
            <g transform="translate(204 286)">
              <g class="capsule capsule--1">
                <circle
                  r="22"
                  fill="#F2C96C"
                />
                <path
                  d="M -22 0 A 22 22 0 0 0 22 0 Z"
                  fill="#F5C7CF"
                />
                <line
                  x1="-22"
                  y1="0"
                  x2="22"
                  y2="0"
                  stroke="#FFFFFF"
                  stroke-width="2"
                  opacity="0.5"
                />
              </g>
            </g>
            <g transform="translate(256 280)">
              <g class="capsule capsule--2">
                <circle
                  r="23"
                  fill="#F5C7CF"
                />
                <path
                  d="M -23 0 A 23 23 0 0 0 23 0 Z"
                  fill="#A9D66F"
                />
                <line
                  x1="-23"
                  y1="0"
                  x2="23"
                  y2="0"
                  stroke="#FFFFFF"
                  stroke-width="2"
                  opacity="0.5"
                />
              </g>
            </g>
            <g transform="translate(308 286)">
              <g class="capsule capsule--3">
                <circle
                  r="22"
                  fill="#F5C7CF"
                />
                <path
                  d="M -22 0 A 22 22 0 0 0 22 0 Z"
                  fill="#F2C96C"
                />
                <line
                  x1="-22"
                  y1="0"
                  x2="22"
                  y2="0"
                  stroke="#FFFFFF"
                  stroke-width="2"
                  opacity="0.5"
                />
              </g>
            </g>
            <g transform="translate(230 302)">
              <g class="capsule capsule--4">
                <circle
                  r="23"
                  fill="#A9D66F"
                />
                <path
                  d="M -23 0 A 23 23 0 0 0 23 0 Z"
                  fill="#F2C96C"
                />
                <line
                  x1="-23"
                  y1="0"
                  x2="23"
                  y2="0"
                  stroke="#FFFFFF"
                  stroke-width="2"
                  opacity="0.5"
                />
              </g>
            </g>
            <!-- Front row -->
            <g transform="translate(282 302)">
              <g class="capsule capsule--5">
                <circle
                  r="23"
                  fill="#F2C96C"
                />
                <path
                  d="M -23 0 A 23 23 0 0 0 23 0 Z"
                  fill="#A9D66F"
                />
                <line
                  x1="-23"
                  y1="0"
                  x2="23"
                  y2="0"
                  stroke="#FFFFFF"
                  stroke-width="2"
                  opacity="0.5"
                />
              </g>
            </g>
          </g>

          <!-- Capsule Holder Front Lip -->
          <g class="capsules-base">
            <rect
              x="176"
              y="304"
              width="160"
              height="20"
              rx="9"
              fill="url(#somGoldGradient)"
            />
            <rect
              x="176"
              y="304"
              width="160"
              height="6"
              rx="3"
              fill="#FFE083"
              opacity="0.38"
            />
            <rect
              x="182"
              y="318"
              width="148"
              height="6"
              rx="3"
              fill="#7D3748"
              opacity="0.2"
            />
          </g>
        </g>
      </g>

      <!-- Top Cap -->
      <path
        d="M 240 20 A 16 16 0 0 1 272 20"
        fill="none"
        stroke="url(#somGoldGradient)"
        stroke-width="11"
        stroke-linecap="round"
      />
      <path
        d="M 176 60 A 80 40 0 0 1 336 60 Z"
        fill="url(#somRedGradient)"
      />
      <rect
        x="166"
        y="54"
        width="180"
        height="16"
        rx="8"
        fill="url(#somGoldGradient)"
      />
    </g>
  </svg>
</template>

<script setup lang="ts">
  withDefaults(
    defineProps<{
      rolling?: boolean
      revealed?: boolean
    }>(),
    {
      rolling: false,
      revealed: false,
    }
  )
</script>

<style scoped>
  .whim-o-matic-svg {
    display: block;
    width: 100%;
    height: auto;
    overflow: visible;
  }

  .lucky-gachapon-machine {
    margin-inline: auto;
    width: min(100%, 22rem);
    aspect-ratio: 4 / 5;
    filter: drop-shadow(0 1.2rem 1.1rem rgb(72 32 34 / 0.2));
  }

  .lucky-gachapon-machine--loading {
    width: min(78%, 13rem);
    filter: drop-shadow(0 1rem 1rem rgb(72 32 34 / 0.2));
  }

  .capsule {
    transform-box: fill-box;
    transform-origin: center;
  }

  .capsule--1 {
    --capsule-spin: 90deg;
  }

  .capsule--2 {
    --capsule-spin: -80deg;
  }

  .capsule--3 {
    --capsule-spin: 100deg;
  }

  .capsule--4 {
    --capsule-spin: -90deg;
  }

  .capsule--5 {
    --capsule-spin: 80deg;
  }

  .prize-capsule {
    opacity: 0;
    transform: translateY(-54px);
  }

  .prize-capsule-rotator {
    --capsule-spin: 360deg;
    transform-box: fill-box;
    transform-origin: center;
  }

  .is-revealed .prize-capsule {
    opacity: 1;
  }

  .is-rolling .lever {
    transform-origin: 152px 432px;
    animation: lever-pull 2.5s ease-in-out forwards;
  }

  .is-rolling .capsules .capsule {
    animation: capsule-spin 2.5s ease-in-out forwards;
  }

  .is-rolling .prize-capsule {
    transform-origin: 256px 432px;
    animation: prize-drop 2.5s cubic-bezier(0.25, 1, 0.5, 1) forwards;
  }

  .is-rolling .prize-capsule-rotator {
    animation: capsule-spin 2.5s ease-in-out forwards;
  }

  @keyframes lever-pull {
    0% {
      transform: rotate(0deg);
    }
    15% {
      transform: rotate(-35deg);
    }
    25% {
      transform: rotate(5deg);
    }
    35% {
      transform: rotate(-2deg);
    }
    45%,
    100% {
      transform: rotate(0deg);
    }
  }

  @keyframes capsule-spin {
    0% {
      transform: rotate(0deg);
    }

    100% {
      transform: rotate(var(--capsule-spin, 360deg));
    }
  }

  @keyframes prize-drop {
    0%,
    48% {
      opacity: 0;
      transform: translateY(-60px);
    }

    52% {
      opacity: 1;
      transform: translateY(-48px);
      animation-timing-function: cubic-bezier(0.18, 0.02, 0.72, 0.24);
    }

    78% {
      transform: translateY(45px);
      animation-timing-function: cubic-bezier(0.18, 0.72, 0.28, 1);
    }

    90% {
      transform: translateY(42px);
      animation-timing-function: ease-out;
    }

    100% {
      opacity: 1;
      transform: translateY(45px);
    }
  }
</style>

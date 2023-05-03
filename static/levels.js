window.levels = {
  difficulty: 'easy',
  levels: [
    {
      victoryY: 100,
    },
    {
      victoryY: -400,
      customGround: true,
      create: (w, h) => [
        Matter.Bodies.rectangle(w / 2, h - 10, w / 2, 10, {
          isStatic: true,
          label: 'level ground',
          restitution: 0,
        }),
      ],
    },
    {
      victoryY: -600,
      customGround: true,
      create: (w, h) => [
        Matter.Bodies.rectangle(w / 4, h - 10, w / 2, 10, {
          isStatic: true,
          label: 'level ground',
          restitution: 0,
        }),
        Matter.Bodies.rectangle((w / 4) * 3, 0, w / 3, 10, {
          isStatic: true,
          label: 'level ground',
          restitution: 0,
        }),
        Matter.Bodies.rectangle(w / 4, -280, w / 2, 10, {
          isStatic: true,
          label: 'level block',
          restitution: 0,
        }),
      ],
    },
    {
      victoryY: -400,
      initStep: 3,
      customGround: true,
      create: (w, h) => [
        Matter.Bodies.rectangle(w / 6, h - 10, w / 4, 10, {
          isStatic: true,
          label: 'level ground',
          restitution: 0,
        }),
        Matter.Bodies.rectangle((w / 6) * 5, h - 10, w / 4, 10, {
          isStatic: true,
          label: 'level ground',
          restitution: 0,
        }),
        ...[
          Matter.Bodies.trapezoid(060, 90, 30, 60, 0.5),
          Matter.Bodies.trapezoid(080, 90, 30, 60, 0.5),
          Matter.Bodies.trapezoid(320, 90, 30, 60, 0.5),
          Matter.Bodies.trapezoid(350, 90, 30, 60, 0.5),
        ].map((body) => {
          body.label = 'level block';
          body.restitution = 0;
          return body;
        }),
      ],
    },
    {
      victoryY: -600,
      create: (w, h) => [
        Matter.Bodies.rectangle(-20, w / 2, 100, h - 20, {
          isStatic: true,
          label: 'level ground move_x wake_up',
          restitution: 0,
          friction: 1,
          _move: {
            x: {
              limits: [-20, w * 2],
              speed: 0.03,
            },
          },
        }),
      ],
    },
    {
      victoryY: 100,
      difficulty: 'hard',
      initStep: 3,
      getPlatformSize: () => 80,
    },
    {
      victoryY: 10,
      difficulty: 'easy',
      customGround: true,
      create: (w, h) => [
        Matter.Bodies.rectangle(w / 2, 300, w - 10, 10, {
          isStatic: true,
          label: 'level ground wake_up move_y',
          restitution: 0,
          friction: 1,
          _move: {
            y: {
              limits: [300, 5000],
              speed: 0.05,
            },
          },
        }),
      ],
    },
    {
      victoryY: 100,
      difficulty: 'easy',
      create: (w, h) => [
        Matter.Bodies.rectangle(-20, h / 2, 100, h - 20, {
          isStatic: true,
          label: 'level ground move_x wake_up',
          restitution: 0,
          friction: 1,
          _move: {
            x: {
              limits: [-20, w / 4],
              speed: 1,
            },
          },
        }),
        Matter.Bodies.rectangle(w + 20, h / 2, 100, h - 20, {
          isStatic: true,
          label: 'level ground move_x wake_up',
          restitution: 0,
          friction: 1,
          _move: {
            x: {
              limits: [3 * (w / 4), w + 20],
              speed: 1,
            },
          },
        }),
      ],
    },
    {
      victoryY: -200,
      difficulty: 'easy',
      customGround: true,
      create: (w, h) => [
        Matter.Bodies.rectangle(w / 4, h - 10, w / 2, 10, {
          label: 'level ground',
          isStatic: true,
          restitution: 0,
          friction: 1,
        }),
        Matter.Bodies.rectangle(w / 4, -210, w / 2, 10, {
          label: 'level ground',
          isStatic: true,
          restitution: 0,
          friction: 1,
        }),
      ],
    },
    {
      victoryY: -100,
      difficulty: 'hard',
      customGround: true,
      create: (w, h) => [
        Matter.Bodies.rectangle(w / 4, h - 10, 300, 10, {
          label: 'level ground move_x wake_up',
          isStatic: true,
          restitution: 0,
          friction: 1,
          _move: {
            x: {
              limits: [w / 4, 3 * (w / 4)],
              speed: 1,
            },
          },
        }),
      ],
    },
  ],
};

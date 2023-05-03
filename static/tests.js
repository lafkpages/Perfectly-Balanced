window.tests = [
  0,                // wheel to move camera
  0,                // immortality
  0,                // permastatic bodies
  0,                // static on collision
  0,                // asleep on collision
  0,                // reset velocities on collision if
                    // angular velocity is less than threshold
  0,                // reset velocities on collision if
                    // x velocity is less than threshold
  0,                // log body labels on collision
];

window.tests[5.1] = 0.2;
window.tests[6.1] = 0.1;

if (tests[7])
  window.log_collision_labels = true;
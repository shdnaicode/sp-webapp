export const SLUG_TITLE_MAP = {
  "intro-to-robotics": "Intro to Robotics",
  "arduino-basics": "Arduino Basics",
  "sensors-and-actuators": "Sensors & Actuators",
  "computer-vision": "Computer Vision",
  "ros-fundamentals": "ROS Fundamentals",
};

// Central course map with modules and stable module keys. Keep this as the single source of truth.
export const COURSE_MAP = {
  "intro-to-robotics": {
    title: "Intro to Robotics",
    modules: [
      { title: "What is a Robot?", key: "intro", description: "Definition, history, applications", videoUrl: "https://www.youtube.com/embed/htjRUL3neMg" },
  { title: "Types of Robot", key: "kinematics", description: "Pre-programmed Robots, Autonomous Robots, Humanoid Robots, Teleoperated Robots, and Augmenting Robots.", videoUrl: "https://www.youtube.com/embed/fc_Cynqr6jM" },
  { title: "Uses of Robots", key: "control", description: "Applications across manufacturing, healthcare, logistics, exploration, and daily life", videoUrl: "https://www.youtube.com/embed/rBNzAGlSfnI" },
    ],
  },
  "arduino-basics": {
    title: "Arduino Basics",
    modules: [
      { title: "Intro to Arduino & IDE", key: "ide", description: "Setup IDE, blink" },
      { title: "Digital I/O & PWM", key: "io", description: "Pins, PWM" },
      { title: "Serial & Sensors", key: "sensors", description: "Serial monitor, analog read" },
    ],
  },
  "sensors-and-actuators": {
    title: "Sensors & Actuators",
    modules: [
      { title: "Sensor Basics", key: "sensors", description: "Analog vs digital, noise" },
      { title: "Actuator Drivers", key: "drivers", description: "H-bridges, servos, power" },
      { title: "Integrating Systems", key: "integrate", description: "Fusion, control signals" },
    ],
  },
  "computer-vision": {
    title: "Computer Vision",
    modules: [
      { title: "Vision Basics", key: "basics", description: "Images & pixels" },
      { title: "Filtering & Edges", key: "edges", description: "Convolution, edge detection" },
      { title: "Tracking Intro", key: "tracking", description: "Contours, optical flow" },
    ],
  },
  "ros-fundamentals": {
    title: "ROS Fundamentals",
    modules: [
      { title: "ROS Concepts", key: "concepts", description: "ROS1 vs ROS2, core tools" },
      { title: "Nodes & Topics", key: "nodes", description: "Publish/subscribe, messages" },
      { title: "Packages & Launch", key: "packages", description: "Structure, launch files" },
    ],
  },
};

export function slugToTitle(slug) {
  if (!slug) return "";
  if (SLUG_TITLE_MAP[slug]) return SLUG_TITLE_MAP[slug];
  return String(slug)
    .split("-")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export function humanizeActivityText(text) {
  if (!text) return "";
  let t = String(text);
  for (const [slug, title] of Object.entries(SLUG_TITLE_MAP)) {
    t = t.split(slug).join(title);
  }
  return t;
}

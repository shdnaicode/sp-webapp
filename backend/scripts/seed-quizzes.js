import mongoose from "mongoose";
import dotenv from "dotenv";
import Quiz from "../models/quiz.js";

// Toggle this to true when you want to enable seeding again
const ENABLE_SEED = false;

dotenv.config();

const data = [
  // Intro to Robotics
  {
    course: "intro-to-robotics",
    moduleKey: "intro",
    items: [
      {
        question: "Which best defines a robot?",
        explanation: "A robot is a programmable machine capable of carrying out complex actions automatically.",
        options: [
          { text: "A simple mechanical device with no electronics", correct: false },
          { text: "A programmable machine capable of automatic actions", correct: true },
          { text: "Any device with a motor", correct: false },
          { text: "A computer without sensors or actuators", correct: false },
        ],
      },
      {
        question: "Which is a common application domain for robots?",
        explanation: "Industrial manufacturing is one of the earliest and most common domains.",
        options: [
          { text: "Industrial manufacturing", correct: true },
          { text: "Knitting sweaters manually", correct: false },
          { text: "Purely decorative art", correct: false },
          { text: "Board games only", correct: false },
        ],
      },
    ],
  },
  {
    course: "intro-to-robotics",
    moduleKey: "kinematics",
    items: [
      {
        question: "Kinematics primarily deals with…",
        explanation: "Kinematics studies motion without considering forces (that’s dynamics).",
        options: [
          { text: "Forces causing motion", correct: false },
          { text: "Motion without regard to forces", correct: true },
          { text: "Thermal properties of materials", correct: false },
          { text: "Electrical circuit design", correct: false },
        ],
      },
      {
        question: "A revolute joint allows which type of movement?",
        explanation: "Revolute joints rotate about an axis.",
        options: [
          { text: "Linear translation only", correct: false },
          { text: "Rotation about an axis", correct: true },
          { text: "No relative motion", correct: false },
          { text: "Expansion and contraction", correct: false },
        ],
      },
    ],
  },
  {
    course: "intro-to-robotics",
    moduleKey: "control",
    items: [
      {
        question: "Feedback control uses what to adjust actions?",
        explanation: "Feedback control uses sensor measurements to adjust actuators.",
        options: [
          { text: "Random guesses", correct: false },
          { text: "Sensor measurements (feedback)", correct: true },
          { text: "Static tables only", correct: false },
          { text: "Coin flips", correct: false },
        ],
      },
      {
        question: "PID stands for…",
        explanation: "Proportional–Integral–Derivative control.",
        options: [
          { text: "Power–Inertia–Damping", correct: false },
          { text: "Proportional–Integral–Derivative", correct: true },
          { text: "Phase–Interference–Delay", correct: false },
          { text: "Program–Initialize–Deploy", correct: false },
        ],
      },
    ],
  },

  // Arduino Basics
  {
    course: "arduino-basics",
    moduleKey: "ide",
    items: [
      {
        question: "The classic first Arduino program is…",
        explanation: "Blink toggles an LED to verify toolchain and board.",
        options: [
          { text: "Hello Database", correct: false },
          { text: "Blink (toggle an LED)", correct: true },
          { text: "Network scanner", correct: false },
          { text: "PWM motor driver", correct: false },
        ],
      },
      {
        question: "Arduino sketches are typically uploaded via…",
        explanation: "Most boards upload via USB from the IDE.",
        options: [
          { text: "USB from the IDE", correct: true },
          { text: "HDMI", correct: false },
          { text: "Ethernet only", correct: false },
          { text: "Wi‑Fi only", correct: false },
        ],
      },
    ],
  },
  {
    course: "arduino-basics",
    moduleKey: "io",
    items: [
      {
        question: "PWM stands for…",
        explanation: "Pulse Width Modulation varies duty cycle to control effective power.",
        options: [
          { text: "Power Wire Mode", correct: false },
          { text: "Pulse Width Modulation", correct: true },
          { text: "Peripheral Write Method", correct: false },
          { text: "Phase Window Measure", correct: false },
        ],
      },
      {
        question: "digitalWrite(pin, value) sets…",
        explanation: "digitalWrite sets a digital output HIGH or LOW.",
        options: [
          { text: "Analog voltage in volts", correct: false },
          { text: "HIGH or LOW logic level", correct: true },
          { text: "Pin mode", correct: false },
          { text: "Serial baud rate", correct: false },
        ],
      },
    ],
  },
  {
    course: "arduino-basics",
    moduleKey: "sensors",
    items: [
      {
        question: "On Arduino UNO, analogRead returns values in the range…",
        explanation: "On classic 10-bit ADC, analogRead returns 0–1023.",
        options: [
          { text: "0–255", correct: false },
          { text: "0–1023", correct: true },
          { text: "0–4095", correct: false },
          { text: "−1–1", correct: false },
        ],
      },
      {
        question: "For Serial Monitor to show correct characters, you must…",
        explanation: "The baud rate set in code must match the monitor.",
        options: [
          { text: "Match baud rate between sketch and monitor", correct: true },
          { text: "Disable line endings", correct: false },
          { text: "Set board to bootloader mode", correct: false },
          { text: "Use an external DAC", correct: false },
        ],
      },
    ],
  },

  // Sensors & Actuators
  {
    course: "sensors-and-actuators",
    moduleKey: "sensors",
    items: [
      {
        question: "Analog sensor outputs are typically…",
        explanation: "Analog signals vary continuously over a range.",
        options: [
          { text: "Discrete levels only", correct: false },
          { text: "Continuous over a range", correct: true },
          { text: "Digital packets", correct: false },
          { text: "Pure noise", correct: false },
        ],
      },
      {
        question: "Signal noise can often be reduced by…",
        explanation: "Filtering, shielding, and proper grounding reduce noise.",
        options: [
          { text: "Adding noise", correct: false },
          { text: "Filtering/shielding and good grounding", correct: true },
          { text: "Longer unshielded wires", correct: false },
          { text: "Random delays", correct: false },
        ],
      },
    ],
  },
  {
    course: "sensors-and-actuators",
    moduleKey: "drivers",
    items: [
      {
        question: "An H‑bridge is commonly used for…",
        explanation: "H‑bridges let you drive DC motors in both directions.",
        options: [
          { text: "Turning on LEDs", correct: false },
          { text: "Driving DC motors in both directions", correct: true },
          { text: "Reading analog sensors", correct: false },
          { text: "Measuring temperature", correct: false },
        ],
      },
      {
        question: "Hobby servos are controlled using…",
        explanation: "PWM pulse width encodes the target angle.",
        options: [
          { text: "I2C commands only", correct: false },
          { text: "A PWM pulse width signal", correct: true },
          { text: "RS‑232", correct: false },
          { text: "CAN bus only", correct: false },
        ],
      },
    ],
  },
  {
    course: "sensors-and-actuators",
    moduleKey: "integrate",
    items: [
      {
        question: "Sensor fusion aims to…",
        explanation: "Combining multiple sensors improves estimates and robustness.",
        options: [
          { text: "Increase noise", correct: false },
          { text: "Combine sensors to improve estimation", correct: true },
          { text: "Eliminate all sensors", correct: false },
          { text: "Replace control systems", correct: false },
        ],
      },
      {
        question: "A benefit of combining sensors is…",
        explanation: "Reduces uncertainty and handles individual sensor failures better.",
        options: [
          { text: "Higher cost only", correct: false },
          { text: "Reduced uncertainty and more robust estimates", correct: true },
          { text: "Slower response always", correct: false },
          { text: "No calibration needed", correct: false },
        ],
      },
    ],
  },

  // Computer Vision
  {
    course: "computer-vision",
    moduleKey: "basics",
    items: [
      {
        question: "Digital images are composed of…",
        explanation: "Images are grids of pixels with intensity/color values.",
        options: [
          { text: "Vectors only", correct: false },
          { text: "Pixels arranged in a grid", correct: true },
          { text: "Transistors", correct: false },
          { text: "Random noise maps only", correct: false },
        ],
      },
      {
        question: "RGB images typically have how many channels?",
        explanation: "Red, Green, Blue → 3 channels.",
        options: [
          { text: "1", correct: false },
          { text: "3", correct: true },
          { text: "4 only", correct: false },
          { text: "8", correct: false },
        ],
      },
    ],
  },
  {
    course: "computer-vision",
    moduleKey: "edges",
    items: [
      {
        question: "Edge detection often uses…",
        explanation: "Gradients computed via convolution highlight edges.",
        options: [
          { text: "Sorting algorithms", correct: false },
          { text: "Image gradients and convolution", correct: true },
          { text: "Database indexing", correct: false },
          { text: "Audio filtering", correct: false },
        ],
      },
      {
        question: "The Sobel operator is…",
        explanation: "Sobel is a discrete differentiation operator for edge detection.",
        options: [
          { text: "A color space", correct: false },
          { text: "An edge detection operator", correct: true },
          { text: "A compression codec", correct: false },
          { text: "A neural network", correct: false },
        ],
      },
    ],
  },
  {
    course: "computer-vision",
    moduleKey: "tracking",
    items: [
      {
        question: "Optical flow estimates…",
        explanation: "It estimates the apparent motion of pixels between frames.",
        options: [
          { text: "Object temperature", correct: false },
          { text: "Motion of pixels between frames", correct: true },
          { text: "Audio pitch", correct: false },
          { text: "Network latency", correct: false },
        ],
      },
      {
        question: "Contours in images represent…",
        explanation: "Contours are boundaries of objects in binary/segmented images.",
        options: [
          { text: "Brightness histograms", correct: false },
          { text: "Object boundaries in binary images", correct: true },
          { text: "Fourier spectra", correct: false },
          { text: "Random pixel groups", correct: false },
        ],
      },
    ],
  },

  // ROS Fundamentals
  {
    course: "ros-fundamentals",
    moduleKey: "concepts",
    items: [
      {
        question: "ROS stands for…",
        explanation: "Robot Operating System.",
        options: [
          { text: "Random OS", correct: false },
          { text: "Robot Operating System", correct: true },
          { text: "Real-time OS only", correct: false },
          { text: "Remote OS", correct: false },
        ],
      },
      {
        question: "A key difference of ROS2 vs ROS1 is…",
        explanation: "ROS2 uses DDS for communication and supports real-time features better.",
        options: [
          { text: "ROS2 removes messaging", correct: false },
          { text: "ROS2 uses DDS and improves real-time", correct: true },
          { text: "ROS2 is only for simulation", correct: false },
          { text: "ROS2 drops nodes", correct: false },
        ],
      },
    ],
  },
  {
    course: "ros-fundamentals",
    moduleKey: "nodes",
    items: [
      {
        question: "In ROS, nodes publish messages to…",
        explanation: "Nodes communicate over topics.",
        options: [
          { text: "Services only", correct: false },
          { text: "Topics", correct: true },
          { text: "Files", correct: false },
          { text: "DNS", correct: false },
        ],
      },
      {
        question: "Subscribing in ROS means…",
        explanation: "A node receives messages from a topic it subscribes to.",
        options: [
          { text: "Writing parameters", correct: false },
          { text: "Receiving messages from a topic", correct: true },
          { text: "Launching nodes", correct: false },
          { text: "Recording bags", correct: false },
        ],
      },
    ],
  },
  {
    course: "ros-fundamentals",
    moduleKey: "packages",
    items: [
      {
        question: "A ROS package typically contains…",
        explanation: "Packages hold nodes, configs, and supporting files.",
        options: [
          { text: "Operating system kernels", correct: false },
          { text: "Nodes, configs, and resources", correct: true },
          { text: "Only documentation", correct: false },
          { text: "Only compiled binaries", correct: false },
        ],
      },
      {
        question: "Launch files are used to…",
        explanation: "They start multiple nodes with parameters and remappings.",
        options: [
          { text: "Compile code", correct: false },
          { text: "Start multiple nodes with configs", correct: true },
          { text: "Format disks", correct: false },
          { text: "Manage users", correct: false },
        ],
      },
    ],
  },
];

async function main() {
  if (!ENABLE_SEED) {
    console.log("Seed disabled: ENABLE_SEED=false. Skipping quiz inserts.");
    return;
  }
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI is not set. Add it to your .env");
    process.exit(1);
  }
  await mongoose.connect(uri);
  let created = 0;
  for (const block of data) {
    const { course, moduleKey, items } = block;
    for (const item of items) {
      const res = await Quiz.updateOne(
        { course, moduleKey, question: item.question },
        {
          $setOnInsert: {
            options: item.options,
            explanation: item.explanation || "",
          },
        },
        { upsert: true }
      );
      // upsertedCount present on result when an upsert insert occurred
      if (res.upsertedCount && res.upsertedCount > 0) {
        created += res.upsertedCount;
      }
    }
  }
  console.log(`Seeded quizzes created (new inserts): ${created}`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

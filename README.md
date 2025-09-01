# Sankey Particles Visualization

This project provides an **interactive Sankey diagram with animated
particles**, built with **D3.js**.\
It allows you to visualize flows between nodes with particle animations
representing individual records from a dataset.

Particles can be hovered to display tooltips with details (e.g., ID,
description), and the diagram supports custom coloring for nodes and
flow types.

Dedicated to everyone who needs to communicate insights or knowledge 
from data to audiences who may find Sankey diagrams difficult to understand.

------------------------------------------------------------------------

## Features

-   **Animated Sankey Diagram** using D3.js.\
-   **Particles represent each row** in `data.csv`.\
-   **Tooltips on hover** show extra metadata (`ID`, `Description`).\
-   **Custom node colors** defined in `node_colors.csv`.\
-   **Custom flow type colors** defined in `type_colors.csv`.\
-   **Draggable nodes** to rearrange the diagram.

------------------------------------------------------------------------

## Project Structure

    .
    ├── index5.html          # Main HTML container (canvas + svg + script loaders)
    ├── sankey_particles.js  # Main D3.js logic for Sankey and particles
    ├── data.csv             # Input data defining the flows
    ├── node_colors.csv      # Node name → color mapping
    ├── type_colors.csv      # Flow type → color mapping

------------------------------------------------------------------------

## Data Format

### `data.csv`

Each row represents a flow segment. Example:

  ID   Source   Target   Type    Duration   Description
  ---- -------- -------- ------- ---------- -------------------
  1    A        B        video   1200       User stream start
  2    B        C        audio   800        Stream forwarded

-   **ID**: Unique identifier for the flow sequence.\
-   **Source / Target**: Node names.\
-   **Type**: Flow type (used for color).\
-   **Duration**: Animation duration for this segment (ms).\
-   **Description**: Optional text shown in tooltip.

### `node_colors.csv`

  Node   Color
  ------ ---------
  A      #1f77b4
  B      #ff7f0e

### `type_colors.csv`

  Type    Color
  ------- ---------
  video   #2ca02c
  audio   #d62728

------------------------------------------------------------------------

## 🖥️ Usage

1.  Clone the repo:

    ``` bash
    git clone https://github.com/your-username/sankey-particles.git
    cd sankey-particles
    ```

2.  Open `index5.html` in your browser (web server is required)
On mac, super easy: on the folder, in bash: npx http-server

3.  The Sankey diagram will render automatically with animated
    particles.

------------------------------------------------------------------------

## ⚙️ Customization

-   Update `data.csv` to add or modify flows.\
-   Adjust `node_colors.csv` to set specific colors for nodes.\
-   Modify `type_colors.csv` to change flow-type colors.\
-   Tweak parameters inside `sankey_particles.js` (e.g., node width,
    padding, particle size).

------------------------------------------------------------------------

##  Built With

-   [D3.js v3](https://d3js.org/)\
-   Sankey layout (`d3.sankey.js`)\
-   HTML5 Canvas + SVG overlay
-   Copilot because im learning JavaScript 

------------------------------------------------------------------------

## 📜 License

MIT License -- feel free to use, modify, and share.

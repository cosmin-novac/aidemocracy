# AI Democracy

AI Democracy is a policy simulation game inspired by the concept of Democracy 4. It allows you to explore the dynamics of policy-making and their impact on various aspects of society. Developed using innovative techniques, this game combines human input with the power of GPT-4, an advanced language model, to create a unique and interactive gaming experience.

## Innovation with GPT-4

AI Democracy showcases an innovative approach to game development. The game's development process relied heavily on GPT-4, an advanced language model. By leveraging the model's capabilities, the game was created through collaborative interactions and negotiations with GPT-4, without ANY manual coding.

![AI Democracy](/screenshot.png)

## Overview

AI Democracy provides a visual representation of a simulated society, where you can enact policies and observe their effects on different state variables, such as the economy, crime levels, education, and more. The game aims to simulate the complexity and interconnectedness of policy decisions in a dynamic environment.

## Prerequisites

To run AI Democracy, you need to set up a simple HTTP server. You can use any server of your choice, such as Python's `http.server`, Node.js' `http-server`, or any other web server of your preference.

## How to Play

1. Clone the repository to your local machine.
2. Start an HTTP server in the game's directory, for example using python: "python -m http.server 8000".
3. Open a web browser and navigate to the server's address.
4. The game will start automatically, displaying the initial state of the simulated society.
5. Open the settings menu and enter your OpenAI API Key - this is used to generate new policies and their effects.

## Game Features

### State Nodes

State nodes represent various aspects of the simulated society, such as the economy, crime levels, education, and more. These nodes are displayed as interactive elements in the game.

### Policy Nodes

Policy nodes represent the different policies that you can implement in the simulated society. These policies are designed to influence the state variables and bring about changes in the society.

### Voter Nodes

Voter nodes represent the individuals within the simulated society who are influenced by policies. These nodes are essential for understanding the societal impact of policy decisions.

### Connections and Impacts

Lines between nodes depict the connections and impacts of policies on state variables and voters. The thickness and color of the lines represent the strength and nature of the impacts. Green lines indicate positive impacts, while red lines indicate negative impacts.

### Adding and Deleting Policies

You can add new policies to the game by clicking the "Add Policy" button. A dialog box will appear, allowing you to enter the details of the new policy. Each policy addition or deletion requires a certain number of political credits.

### Ending Rounds

To progress through the game, you can end the current round by clicking the "End Round" button. This action triggers the start of a new round, allowing you to observe the evolving dynamics of the simulated society.

### Credits and Rounds

The number of available political credits and the current round are displayed alongside the buttons. The credits represent your resources for adding and deleting policies, while the round indicates your progress in the game.


## Acknowledgments

AI Democracy was developed by Cosmin Novac. We would like to express our gratitude to OpenAI for providing the powerful GPT-4 model that made this project possible.

## License

This project is licensed under the [MIT License](MIT-LICENSE.txt). Feel free to customize the README file according to your needs, adding more sections or details as required.

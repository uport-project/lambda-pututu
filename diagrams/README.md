# Diagrams for uPort::pututu

#### Contents

- [Api V 1 Sns Seq](#api-v-1-sns-seq)
- [Api V 2 Message Seq](#api-v-2-message-seq)
- [Api V 2 Sns Seq](#api-v-2-sns-seq)
- [How to write diagrams](#how-to-write-diagrams)
- [How to generate diagrams](#how-to-generate-diagrams)

#### Api V 1 Sns Seq
![Api V 1 Sns Seq](./img/api-v1.sns.seq.png)
#### Api V 2 Message Seq
![Api V 2 Message Seq](./img/api-v2.message.seq.png)
#### Api V 2 Sns Seq
![Api V 2 Sns Seq](./img/api-v2.sns.seq.png)

#### How to write diagrams

Diagrams are written in [Plant UML](http://plantuml.com/) - full instructions on the website linked.

[Atom](https://atom.io) is a good editor for plant UML

 - [PlantUML language](https://atom.io/packages/language-plantuml) give you syntax highlighting
 - [PlantUML viewer](https://atom.io/packages/plantuml-viewer) lets you a preview of your diagram

#### How to generate diagrams

Once you've written your diagram you'll want to display it somewhere for all to see!

To automatically generate the diagrams and add them to the readme file you need to run `diagram generate`

```sh
# You need to have graphviz installed to generate diagrams

# if you're a windows guy
choco install javaruntime
choco install graphviz

# if you're a mac guy
brew install graphviz

# Add the path to your environment variables
# C:\Program Files (x86)\Graphviz2.38\bin

# Install diagrams globally
npm install -g diagram-cli

# init will create a /diagrams template folder
diagrams init

# make will generate all diagrams within the folder to pngs
diagrams make
```

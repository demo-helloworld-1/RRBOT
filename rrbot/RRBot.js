const { ActivityHandler, MessageFactory } = require('botbuilder');
const {MakeReservationDialog} = require('./componentsDialogs/makeReservationDialog.js')


class RRBot extends ActivityHandler {
    constructor(conversationState,userState) {
        super();

        this.conversationState = conversationState;
        this.userState = userState;

        this.dialogState = conversationState.createProperty("dialogState");
        this.makeReservationDialog = new MakeReservationDialog(this.conversationState, this.userState);



        // See https://aka.ms/about-bot-activity-message to learn more about the message and other activity types.
        this.onMessage(async (context, next) => {
            await this.dispatchToIntentAsync(context);
            await next();
        });

        this.onMembersAdded(async (context, next) => {
            await this.sendWelcomeMessage(context)

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }

    async sendWelcomeMessage(turnContext){
        const {activity} = turnContext;

        for(const idx in activity.membersAdded){
            if(activity.membersAdded[idx].id !==activity.recipient.id){
                const welcomeMessage = `Welcome to Restaurant Reservation Bot ${activity.membersAdded[idx].name}.`;
                await turnContext.sendActivity(welcomeMessage);
                await this.sendSuggestedActions(turnContext);
            }
        }
    }

    async sendSuggestedActions(turnContext){
        var reply = MessageFactory.suggestedActions(['Make Reservation','Cancel Reservation','Restaurant Address'],'What would you like to do today?');
        await turnContext.sendActivity(reply);
    }

    async dispatchToIntentAsync(context){
        // console.log('dispatchToIntentAsync - recieved Text:',context.activity.text);
        switch(context.activity.text){
            case 'Make Reservation':
                // console.log('Starting Reservation dialog')
            await this.makeReservationDialog.run(context,this.dialogState);
            break;


            default: 
            console.log("Did not match Make Reservation Case");
            break;
        }
    }
    // onTurn(context, next) {
    //     console.log('onTurn - received activity type:', context.activity.type);
    //     return super.onTurn(context, next);
    // }

}

module.exports.RRBot = RRBot;

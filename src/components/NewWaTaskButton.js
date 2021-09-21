import React from 'react';
import * as Flex from '@twilio/flex-ui';
import { IconButton, withTheme } from '@twilio/flex-ui';

class NewWaTaskButton extends React.PureComponent {
    constructor(props){
        super(props);
    }

    render(){
        return(
            
                <IconButton icon="Whatsapp" themeOverride={{lightHover: true}} onClick={() => Flex.Actions.invokeAction('waModalControl')}/>

        )
    }
}

export default withTheme(NewWaTaskButton);
import React,{Component} from "react";
import Cookies from 'universal-cookie';
import './signIn.css';

class SignIn extends Component{

    constructor(props) {
        super(props);
        this.state = {
            signInEmail:'',
            signInPassword:'',
            rememberMe:false,
            errorMessage:''
        }
    }
    onEmailChange = (event) => {
      this.setState({signInEmail:event.target.value})
    };
    onPasswordChange = (event) => {
        this.setState({signInPassword:event.target.value})
    };
    onCheck = (event) => {
        this.setState({rememberMe:event.target.checked})
    };


    onSubmit = () =>{
        const{signInEmail,signInPassword} = this.state;

        if(signInPassword.length === 0 || signInEmail.length === 0){
            this.setState({errorMessage:'Fields cannot be empty'});
            return;
        }
        fetch('https://ghost-server.azurewebsites.net/api/login',{
            method:'post',
            headers:{'Content-type':'application/json'},
            body: JSON.stringify({
                email:signInEmail,
                password:signInPassword
            })
        })
            .then(response=> response.json())
            .then (response => {
                if(response){
                    if(this.state.rememberMe){
                        const cookies = new Cookies();
                        //might change to secure implementation later
                        cookies.set('remember', 'true', { path: '/' });
                    }
                    this.setState({errorMessage:''});
                    this.props.loadUser(response,this.state.rememberMe);
                    this.props.onRouteChange('home');
                }
            })
            .catch(error=>{
                this.setState({errorMessage:'Invalid email or password'});
            });
    };

    render(){
        return(
            <article className="br3 ba dark-red b--black-10 mv4 w-100 w-50-m w-25-l mw5 shadow-5 center bg-white-30">
                <main className="pa4 black-80">
                    <form className="measure">
                        <fieldset id="sign_up" className="ba b--transparent ph0 mh0">
                            <legend className="f4 fw6 ph0 mh0">Sign In</legend>
                            <div className="mt3">
                                <label className="db fw6 lh-copy f6" htmlFor="email-address">Email</label>
                                <input onChange={this.onEmailChange} className="pa2 input-reset ba bg-transparent hover-bg-black hover-white w-100"
                                       type="email" name="email-address" id="email-address"/>
                            </div>
                            <div className="mv3">
                                <label className="db fw6 lh-copy f6" htmlFor="password">Password</label>
                                <input onChange={this.onPasswordChange} className="b pa2 input-reset ba bg-transparent hover-bg-black hover-white w-100"
                                       type="password" name="password" id="password"/>
                            </div>
                            <div className='error db fw6 lh-copy f6'>
                                {this.state.errorMessage}
                            </div>
                            <label className="pa0 ma0 lh-copy f6 pointer"><input type="checkbox" onChange={this.onCheck}/> Remember me</label>
                        </fieldset>
                        <div className="">
                            <input onClick={this.onSubmit}
                                className="b ph3 pv2 input-reset ba b--black bg-transparent grow pointer f6 dib"
                                   type="button" value="Sign in"/>
                        </div>
                    </form>
                </main>
            </article>
        );
    }
};


export default SignIn;
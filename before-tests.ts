import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { configure } from 'enzyme';

// http://airbnb.io/enzyme/docs/installation/index.html#working-with-react-16
configure({ adapter: new Adapter() });

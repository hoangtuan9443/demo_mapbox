import * as React from 'react';
import Svg, {Path, SvgProps} from 'react-native-svg';

export const LocationIcon = (props: SvgProps) => (
  <Svg
    width={props.width || 16}
    height={props.height || 16}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}>
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8 0.333252C4.52678 0.333084 1.7014 3.04187 1.66667 6.40523C1.66667 10.6066 7.24792 15.2832 7.48542 15.4825C7.78168 15.7279 8.21832 15.7279 8.51458 15.4825C8.79167 15.2832 14.3333 10.6066 14.3333 6.40523C14.2986 3.04187 11.4732 0.333084 8 0.333252ZM8 8.76656C6.46971 8.76656 5.22917 7.56519 5.22917 6.08323C5.22917 4.60127 6.46971 3.39991 8 3.39991C9.53029 3.39991 10.7708 4.60127 10.7708 6.08323C10.7708 6.79489 10.4789 7.47741 9.95928 7.98063C9.43964 8.48385 8.73487 8.76656 8 8.76656Z"
      fill={props.fill || '#8F9BB3'}
    />
  </Svg>
);

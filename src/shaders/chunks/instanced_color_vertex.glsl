#ifdef USE_INSTANCING_COLOR_INDIRECT
  #ifdef USE_VERTEX_COLOR
    vColor = vec4(color, 1.0);
  #else
    vColor = vec4( 1.0 );
  #endif
#endif
